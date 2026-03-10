#!/usr/bin/env python3
"""
Narkootiliste ainete nimekirja kraapija
Kasutamine: python3 scrape.py [--pdf fail.pdf] [--url URL] [--out data.json]
Soltuvused: pip install pdfplumber
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
    sys.exit("Viga: pdfplumber pole paigaldatud. Kaivita: pip install pdfplumber")

# ── URL-id ────────────────────────────────────────────────────────────────────
ACT_URL = "https://www.riigiteataja.ee/akt/128022023013?leiaKehtiv"
BASE_URL = "https://www.riigiteataja.ee"
# Ei ole vaikimisi URL-i -- kui automaatne leidmine ebaonnestub, skript katkestab.

LIST_TITLES = {1: "I nimekiri", 2: "II nimekiri", 3: "III nimekiri",
               4: "IV nimekiri", 5: "V nimekiri", 6: "VI nimekiri"}
LIST_DESCRIPTIONS = {
    1: "Koige rangemalt piiritletud ained, meditsiiniline kasutus puudub",
    2: "Opioidid ja korge riskiga narkootikumid",
    3: "Kontrollitud ained piiratud meditsiinilise kasutusega",
    4: "Psyhhotroopsed ained meditsiinilise kasutusega",
    5: "Lahteained ja muud kontrollitud ained",
    6: "Kontrollitud ainegruhmad (mitte yksikained)",
}

# ── PDF laadimine ─────────────────────────────────────────────────────────────

def _fetch_text(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def find_lisa1_url():
    """
    Leiab Lisa 1 PDF URL-i Riigi Teataja akti lehelt.
    Otsib tapselt mustrit <a href="...">Lisa 1</a>.
    Annab erindi, kui URL-i ei leita -- ei ole tagavaraplaani.
    """
    print("Otsin Lisa 1 URL-i: " + ACT_URL)
    try:
        html = _fetch_text(ACT_URL)
    except Exception as e:
        raise RuntimeError("Akti lehe laadimine ebaonnestus: " + str(e))

    m = re.search(
        r'<a\s[^>]*href=["\']([ ^"\']+)["\'\'][^>]*>\s*Lisa 1\s*</a>',
        html, re.IGNORECASE,
    )
    if not m:
        raise RuntimeError(
            "Lisa 1 linki ei leitud lehelt " + ACT_URL + "\n"
            "Kontrolli, kas lehe struktuur on muutunud."
        )

    url = m.group(1).split("#")[0]
    print("  Leitud Lisa 1 URL: " + url)
    return url

def load_pdf_bytes(url=None, local_path=None):
    """Laadib PDF-i. Tagastab (tegelik_url, pdf_bytes)."""
    if local_path:
        print("Loen kohalikku faili: " + local_path)
        return local_path, Path(local_path).read_bytes()
    if url is None:
        url = find_lisa1_url()
    print("Laadin alla: " + url)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    print("Allalaaditud: " + str(len(data)) + " baiti")
    return url, data

# ── PDF parsimine ─────────────────────────────────────────────────────────────

LIST_HEADERS = {
    "I NIMEKIRI": 1, "II NIMEKIRI": 2, "III NIMEKIRI": 3,
    "IV NIMEKIRI": 4, "V NIMEKIRI": 5, "VI NIMEKIRI": 6,
}


def _detect_list_header(text):
    cleaned = re.sub(r"\s+", " ", text.strip().upper())
    for header, num in sorted(LIST_HEADERS.items(), key=lambda x: -len(x[0])):
        if cleaned == header:
            return num
    return None


def _clean_cell(text):
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def _process_row(row, current_list, result):
    combined = " ".join(_clean_cell(c) for c in row if c)

    detected = _detect_list_header(combined)
    if detected:
        return detected

    if current_list is None:
        return None

    skip_patterns = [
        r"^eestikeelne", r"^ingliskeelne", r"^nimetus", r"^aineryhma",
        r"narkootiliste.*ainete", r"^[ivx]+\s+nimekiri\s*$", r"^\d+\s*/\s*\d+$",
    ]
    if any(re.search(p, combined.lower()) for p in skip_patterns):
        return current_list

    cells = [_clean_cell(c) for c in row]
    padded = cells + ["", ""]
    et_cell, en_cell = padded[0], padded[1]

    if et_cell == "" and en_cell != "":
        if result[current_list]:
            result[current_list][-1][1] = (result[current_list][-1][1] + " " + en_cell).strip()
        return current_list
    if en_cell == "" and et_cell != "":
        if result[current_list]:
            result[current_list][-1][0] = (result[current_list][-1][0] + " " + et_cell).strip()
        return current_list

    if len(et_cell) > 2 and len(en_cell) > 2:
        result[current_list].append([et_cell, en_cell])
    elif len(et_cell) > 2:
        result[current_list].append([et_cell, ""])

    return current_list


def extract_rows_from_pdf(pdf_bytes):
    result = {i: [] for i in range(1, 7)}
    current_list = None

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        print("Lehekylgi: " + str(len(pdf.pages)))
        for page in pdf.pages:
            events = []

            lines_by_top = {}
            for w in page.extract_words():
                top = round(w["top"])
                lines_by_top.setdefault(top, []).append(w["text"])
            for top, tokens in lines_by_top.items():
                det = _detect_list_header(" ".join(tokens))
                if det is not None:
                    events.append((top, "header", det))

            for tbl in page.find_tables():
                tbl_top = tbl.bbox[1]
                for row_idx, row in enumerate(tbl.extract()):
                    if row:
                        events.append((tbl_top + row_idx, "row", row))

            events.sort(key=lambda e: e[0])

            for _, kind, payload in events:
                if kind == "header":
                    current_list = payload
                elif kind == "row" and any(payload):
                    current_list = _process_row(payload, current_list, result)

    return result

# ── Puhastamine ───────────────────────────────────────────────────────────────

def clean_results(result):
    cleaned = {}
    for list_num, rows in result.items():
        seen = set()
        unique = []
        for row in rows:
            key = row[0].lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(row)
        unique.sort(key=lambda r: r[0].lower())
        cleaned[list_num] = unique
    return cleaned

# ── JSON valjund ──────────────────────────────────────────────────────────────

def build_json(result, pdf_url):
    return {
        "meta": {
            "source": pdf_url,
            "act": ACT_URL,
            "generated": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        },
        "lists": [
            {
                "id": num,
                "title": LIST_TITLES[num],
                "description": LIST_DESCRIPTIONS[num],
                "isGroups": num == 6,
                "substances": [{"et": r[0], "en": r[1]} for r in result.get(num, [])],
            }
            for num in range(1, 7)
        ],
    }

# ── Peaprogramm ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="PDF URL (vaikimisi: automaatne leidmine)")
    parser.add_argument("--pdf", help="Kohaliku PDF faili tee")
    parser.add_argument("--out", default="data.json")
    args = parser.parse_args()

    try:
        actual_url, pdf_bytes = load_pdf_bytes(url=args.url, local_path=args.pdf)
    except Exception as e:
        sys.exit("Viga PDF laadimisel: " + str(e))

    print("Parsin PDF-i...")
    raw = extract_rows_from_pdf(pdf_bytes)
    result = clean_results(raw)

    total = sum(len(v) for v in result.values())
    for num in range(1, 7):
        unit = "ryhma" if num == 6 else "ainet"
        print("  Nimekiri " + str(num) + ": " + str(len(result[num])) + " " + unit)
    print("  Kokku: " + str(total))

    empty = [n for n in range(1, 7) if not result[n]]
    if empty:
        msg = "VIGA: Tyhjad nimekirjad: " + str(empty) + "\nPDF struktuur on ilmselt muutunud."
        print("\n" + msg, file=sys.stderr)
        print("\n" + msg)
        sys.exit(1)

    output = build_json(result, actual_url)
    out_path = Path(args.out)
    tmp_path = out_path.with_suffix(".tmp")
    try:
        tmp_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(out_path)
    except PermissionError:
        alt_path = out_path.with_stem(out_path.stem + "_new")
        tmp_path.rename(alt_path)
        out_path = alt_path
        print("Ei saanud kirjutada '" + args.out + "'. Salvestatud: " + str(alt_path))

    print("\nSalvestatud: " + str(out_path) + " (" + str(out_path.stat().st_size) + " baiti)")


if __name__ == "__main__":
    main()
