#!/usr/bin/env python3
"""
Narkootiliste ainete nimekirja kraapija
---------------------------------------
Laadib alla sotsiaalministri määruse lisa 1 PDF Riigi Teatajast,
parsib nimekirjad I–VI ja salvestab tulemuse data.json faili.

Kasutamine:
    python3 scrape.py
    python3 scrape.py --pdf /tee/failini.pdf   # kasuta kohalikku PDF faili
    python3 scrape.py --url https://...         # kasuta kohandatud URL-i
    python3 scrape.py --out minu_andmed.json    # kohandatud väljundfail

Sõltuvused:
    pip install pdfplumber requests
"""

import argparse
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("Viga: pdfplumber pole paigaldatud. Käivita: pip install pdfplumber")

# ── Vaikimisi PDF URL ────────────────────────────────────────────────────────
# See URL uueneb iga muudatusega. Kontrolli aeg-ajalt Riigi Teatajast
# uusimat versiooni: https://www.riigiteataja.ee/akt/120122023041
DEFAULT_URL = "https://www.riigiteataja.ee/aktilisa/1300/7202/5008/SOM_m31_lisa1.pdf"

# Nimekirja pealkirjad (kuvatakse veebilehel)
LIST_TITLES = {
    1: "I nimekiri",
    2: "II nimekiri",
    3: "III nimekiri",
    4: "IV nimekiri",
    5: "V nimekiri",
    6: "VI nimekiri",
}

LIST_DESCRIPTIONS = {
    1: "Kõige rangemalt piiritletud ained, meditsiiniline kasutus puudub",
    2: "Opioidid ja kõrge riskiga narkootikumid",
    3: "Kontrollitud ained piiratud meditsiinilise kasutusega",
    4: "Psühhotroopsed ained meditsiinilise kasutusega",
    5: "Lähteained ja muud kontrollitud ained",
    6: "Kontrollitud ainerühmad (mitte üksikained)",
}

# ── PDF laadimine ────────────────────────────────────────────────────────────

def load_pdf_bytes(url: str = None, local_path: str = None) -> bytes:
    if local_path:
        print(f"Loen kohalikku faili: {local_path}")
        return Path(local_path).read_bytes()
    target = url or DEFAULT_URL
    print(f"Laadin alla: {target}")
    req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    print(f"Allalaaditud: {len(data):,} baiti")
    return data

# ── PDF parsimine ────────────────────────────────────────────────────────────

# Nimekirja päised PDFis (eesti keeles, suurtähtedega)
LIST_HEADERS = {
    "I NIMEKIRI": 1,
    "II NIMEKIRI": 2,
    "III NIMEKIRI": 3,
    "IV NIMEKIRI": 4,
    "V NIMEKIRI": 5,
    "VI NIMEKIRI": 6,
}

def extract_rows_from_pdf(pdf_bytes: bytes) -> dict:
    """
    Parsib PDF-ist kõik 6 nimekirja.
    Tagastab dict: {1: [["ET nimi", "EN nimi"], ...], 2: [...], ...}
    """
    result = {i: [] for i in range(1, 7)}
    current_list = None

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        print(f"Lehekülgi: {len(pdf.pages)}")
        for page_num, page in enumerate(pdf.pages, 1):
            # Kogu lehekülje kõik sündmused (päised + tabeliread) vertikaalselt järjestatult.
            # See tagab, et nimekirja päis tuvastatkase õigeaegselt ka siis, kui
            # ühel lehel on mitu nimekirja (nt III ja IV NIMEKIRI).

            events = []  # (top_y, kind, payload)

            # 1) Leia kõik nimekirja päised tekstiridade hulgast koos y-koordinaadiga
            words = page.extract_words()
            # Grupeeri sõnad ridadesse (ligikaudu sama top-koordinaadiga)
            lines_by_top = {}
            for w in words:
                top = round(w["top"])
                lines_by_top.setdefault(top, []).append(w["text"])
            for top, tokens in lines_by_top.items():
                line_text = " ".join(tokens)
                det = _detect_list_header(line_text)
                if det is not None:
                    events.append((top, "header", det))

            # 2) Leia kõik tabeliread koos y-koordinaadiga
            tables = page.extract_tables(
                {"explicit_vertical_lines": [], "explicit_horizontal_lines": []}
            )
            for table in tables:
                # extract_tables ei anna y-koordinaate; kasuta extract_table_settings
                # koos bbox-iga — lihtsam viis: võta tabeliobjekti bbox.
                # pdfplumber Table objektid on kättesaadavad page.find_tables() kaudu
                pass

            # Kasuta page.find_tables() et saada Table-objektid koos bbox-iga
            found_tables = page.find_tables()
            for tbl_obj in found_tables:
                tbl_top = tbl_obj.bbox[1]  # tabeli ülemine serv
                rows = tbl_obj.extract()
                for row_idx, row in enumerate(rows):
                    if not row:
                        continue
                    # Ligikaudne y: jaota tabeli kõrgus ühtlaselt ridade vahel
                    row_y = tbl_top + row_idx  # piisavalt täpne järjestamiseks
                    events.append((row_y, "row", row))

            # Sorteeri kõik sündmused vertikaalselt (ülevalt alla)
            events.sort(key=lambda e: e[0])

            # Töötle järjekorras
            for _, kind, payload in events:
                if kind == "header":
                    current_list = payload
                elif kind == "row":
                    if not any(payload):
                        continue
                    current_list = _process_row(payload, current_list, result)

    return result

    return result


def _is_continuation_row(cells: list) -> tuple:
    """
    Tuvastab, kas tegu on jätku-reaga (eelmine kirje jätkub järgmisel real).
    Tagastab (on_jätk, et_jätk, en_jätk).

    Jätku-rida on selline, kus täpselt üks lahter on tühi — see täiendab
    eelmist kirjet vastava keele poolel.
    """
    if len(cells) < 2:
        return False, "", ""
    et, en = cells[0], cells[1]
    et_empty = et == ""
    en_empty = en == ""
    if et_empty and not en_empty:
        return True, "", en
    if en_empty and not et_empty:
        return True, et, ""
    return False, "", ""


def _detect_list_header(text: str) -> int | None:
    """Tuvastab nimekirja pealkirja real (täpne vastavus)."""
    cleaned = re.sub(r"\s+", " ", text.strip().upper())
    # Kasuta täpset vastavust, mitte 'in'-operaatorit, et vältida
    # olukorda, kus 'I NIMEKIRI' tuvastatkase vale 'II NIMEKIRI' sees.
    for header, num in sorted(LIST_HEADERS.items(), key=lambda x: -len(x[0])):
        if cleaned == header:
            return num
    return None


def _clean_cell(text) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def _process_row(row: list, current_list: int | None, result: dict) -> int | None:
    """Töötleb ühte tabelirida. Tagastab uuendatud nimekirja numbri."""
    # Ühenda kõik lahtrid üheks kontrollimiseks
    combined = " ".join(_clean_cell(c) for c in row if c)

    # Kontrolli, kas rida on nimekirja päis
    detected = _detect_list_header(combined)
    if detected:
        return detected

    if current_list is None:
        return None

    # Filtreeri päised, tühjad read ja lehepäised
    skip_patterns = [
        r"^eestikeelne",
        r"^ingliskeelne",
        r"^nimetus",
        r"^ainerühma",
        r"narkootiliste.*ainete",
        r"^[ivx]+\s+nimekiri\s*$",
        r"^\d+\s*/\s*\d+$",  # lehenumber
    ]
    if any(re.search(p, combined.lower()) for p in skip_patterns):
        return current_list

    # Eralda eesti ja inglise veerud (võta esimesed kaks lahtrit)
    cells = [_clean_cell(c) for c in row]
    # Täienda kahe lahtriga nimekirja (et, en), ülejäänud ignoreeri
    padded = cells + ["", ""]
    et_cell = padded[0]
    en_cell = padded[1]

    # Jätku-rea tuvastamine: täpselt üks lahter on täidetud
    is_cont, et_cont, en_cont = _is_continuation_row([et_cell, en_cell])
    if is_cont:
        # Lisa jätk eelmise kirje lõppu (kui kirje olemas)
        if result[current_list]:
            prev = result[current_list][-1]
            if et_cont:
                prev[0] = (prev[0] + " " + et_cont).strip()
            if en_cont:
                prev[1] = (prev[1] + " " + en_cont).strip()
        return current_list

    # Tavaline rida: mõlemad lahtrid täidetud
    if len(et_cell) > 2 and len(en_cell) > 2:
        result[current_list].append([et_cell, en_cell])
    elif len(et_cell) > 2 and not en_cell:
        # Ingliskeelne nimi tuleb järgmisel real
        result[current_list].append([et_cell, ""])

    return current_list


def _process_text_line(line: str, current_list: int | None, result: dict) -> int | None:
    """Tagavara: töötleb tekstirida (kui tabelid pole kättesaadavad)."""
    if not line:
        return current_list

    detected = _detect_list_header(line)
    if detected:
        return detected

    if current_list is None:
        return None

    # Teksti režiimis on eesti ja inglise nimed tavaliselt tühikuga eraldatud
    # kuid see on vähem usaldusväärne — tabelirežiim on parem
    return current_list


# ── Duplikaatide eemaldamine ja puhastamine ──────────────────────────────────

def clean_results(result: dict) -> dict:
    cleaned = {}
    for list_num, rows in result.items():
        seen = set()
        unique = []
        for row in rows:
            key = row[0].lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(row)
        # Sorteeri tähestiku järgi
        unique.sort(key=lambda r: r[0].lower())
        cleaned[list_num] = unique
    return cleaned


# ── JSON väljund ─────────────────────────────────────────────────────────────

def build_json(result: dict, pdf_url: str) -> dict:
    lists = []
    for num in range(1, 7):
        rows = result.get(num, [])
        lists.append({
            "id": num,
            "title": LIST_TITLES[num],
            "description": LIST_DESCRIPTIONS[num],
            "isGroups": num == 6,
            "substances": [
                {"et": row[0], "en": row[1]} for row in rows
            ],
        })

    return {
        "meta": {
            "source": pdf_url or DEFAULT_URL,
            "generated": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        },
        "lists": lists,
    }


# ── Peaprogramm ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Kraabi narkootiliste ainete nimekiri PDF-ist JSON-i")
    parser.add_argument("--url", help="PDF URL (vaikimisi Riigi Teataja uusim)")
    parser.add_argument("--pdf", help="Kohaliku PDF faili tee")
    parser.add_argument("--out", default="data.json", help="Väljundfail (vaikimisi: data.json)")
    args = parser.parse_args()

    # Lae PDF
    try:
        pdf_bytes = load_pdf_bytes(url=args.url, local_path=args.pdf)
    except Exception as e:
        sys.exit(f"Viga PDF laadimisel: {e}")

    # Parsi
    print("Parsin PDF-i...")
    raw = extract_rows_from_pdf(pdf_bytes)

    # Puhasta
    result = clean_results(raw)

    # Statistika
    total = sum(len(v) for v in result.values())
    for num in range(1, 7):
        unit = "rühma" if num == 6 else "ainet"
        print(f"  Nimekiri {num}: {len(result[num])} {unit}")
    print(f"  Kokku: {total}")

    # Salvesta
    output = build_json(result, args.url)
    out_path = Path(args.out)
    # Kirjuta esmalt ajutisse faili, seejärel asenda sihtfail.
    # See väldib Windows'i loavigu (PermissionError), kui sihtfail on parajasti avatud.
    import tempfile
    tmp_path = out_path.with_suffix(".tmp")
    try:
        tmp_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(out_path)
    except PermissionError:
        # Viimane abinõu: proovi alternatiivset failinime
        alt_path = out_path.with_stem(out_path.stem + "_new")
        tmp_path.rename(alt_path)
        out_path = alt_path
        print(f"\n⚠️  Ei saanud kirjutada '{args.out}' (fail on avatud?). Salvestatud: {alt_path}")
    print(f"\nSalvestatud: {out_path} ({out_path.stat().st_size:,} baiti)")

    # Hoiatus kui mõni nimekiri on tühi
    empty = [n for n in range(1, 7) if not result[n]]
    if empty:
        print(f"\n⚠️  HOIATUS: Tühjad nimekirjad: {empty}")
        print("   See võib tähendada, et PDF struktuur on muutunud.")
        print("   Kontrolli PDF-i käsitsi ja vajadusel uuenda skripti.")


if __name__ == "__main__":
    main()
