import {
  pad2,
  parseDMY,
  todayDMY,
  fmtDMY,
  calcAge,
  totalDays,
  parseIdCode,
} from "./utils.js";
import { initSidebarToggle, setFooterYear, markActiveNav } from "./layout.js";

// layout helpers
initSidebarToggle();
setFooterYear();
markActiveNav("isikukood.html");

// polyfill for date inputs
function normalizeDateInput(val) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split("-");
    return `${d}.${m}.${y}`;
  }
  return val;
}

// DOM refs
const codeInput = document.getElementById("code-input");
const codeDisplay = document.getElementById("code-display");
const codeClear = document.getElementById("code-clear");
const codeHint = document.getElementById("code-hint");
const dobInput = document.getElementById("dob-input");
const dobHint = document.getElementById("dob-hint");
const refInput = document.getElementById("ref-input");
const refTodayBtn = document.getElementById("ref-today-btn");
const ageContent = document.getElementById("age-content");
const blockInfo = document.getElementById("block-info");
const infoRows = document.getElementById("info-rows");
const blockChecksum = document.getElementById("block-checksum");
const checksumContent = document.getElementById("checksum-content");

// state
let state = {
  source: null, // 'code' | 'dob'
  born: null, // {y,m,d}
  ref: todayDMY(),
  idParsed: null,
};

function setRefToday() {
  state.ref = todayDMY();
  refInput.value = "";
  refInput.classList.remove("is-valid", "is-error");
  refTodayBtn.classList.add("active");
  render();
}

refTodayBtn.addEventListener("click", setRefToday);

refInput.addEventListener("input", () => {
  let v = refInput.value.trim();
  if (v && refInput.type === "date") {
    v = normalizeDateInput(v);
  }
  if (!v) {
    setRefToday();
    return;
  }
  const p = parseDMY(v);
  if (p) {
    state.ref = p;
    refInput.classList.add("is-valid");
    refInput.classList.remove("is-error");
    refTodayBtn.classList.remove("active");
  } else {
    refInput.classList.add("is-error");
    refInput.classList.remove("is-valid");
    refTodayBtn.classList.remove("active");
  }
  render();
});

// code input logic
codeInput.addEventListener("input", () => {
  const raw = codeInput.value.replace(/\D/g, "").slice(0, 11);
  codeInput.value = raw;

  codeClear.classList.toggle("visible", raw.length > 0);

  if (raw.length === 0) {
    clearCodeState();
    if (!dobInput.value.trim()) clearResults();
    return;
  }

  if (raw.length > 0) {
    dobInput.value = "";
    dobInput.classList.remove("is-valid", "is-error");
    dobHint.textContent = "kuupäev kujul PP.KK.AAAA";
    dobHint.classList.remove("err");
  }

  updateCodeDisplay(raw);

  if (raw.length < 11) {
    codeInput.classList.remove("is-valid", "is-error");
    codeHint.textContent = 11 - raw.length + " numbrit puudu";
    codeHint.classList.remove("err");
    state.source = null;
    state.born = null;
    state.idParsed = null;
    clearResults();
    return;
  }

  const parsed = parseIdCode(raw);
  if (!parsed.valid) {
    codeInput.classList.add("is-error");
    codeInput.classList.remove("is-valid");
    codeHint.textContent = parsed.error;
    codeHint.classList.add("err");
    state.source = null;
    state.born = null;
    state.idParsed = null;
    clearResults();
    return;
  }

  codeInput.classList.add("is-valid");
  codeInput.classList.remove("is-error");
  codeHint.textContent = parsed.checksumOk
    ? "Kontrollnumber korrektne"
    : "Kontrollnumber vale";
  codeHint.classList.toggle("err", !parsed.checksumOk);

  state.source = "code";
  state.born = parsed.born;
  state.idParsed = parsed;
  render();
});

codeClear.addEventListener("click", () => {
  codeInput.value = "";
  codeInput.classList.remove("is-valid", "is-error");
  codeHint.textContent = "11-kohaline isikukood";
  codeHint.classList.remove("err");
  codeDisplay.innerHTML = "";
  codeClear.classList.remove("visible");
  clearCodeState();
  clearResults();
});

function clearCodeState() {
  state.source = null;
  state.born = null;
  state.idParsed = null;
  blockInfo.style.display = "none";
  blockChecksum.style.display = "none";
}

function updateCodeDisplay(raw) {
  const PLACEHOLDER = "37605030000";
  let html = "";
  for (let i = 0; i < 11; i++) {
    if (i < raw.length) {
      html += '<span class="cd-digit">' + raw[i] + "</span>";
    } else {
      html += '<span class="cd-dim">' + PLACEHOLDER[i] + "</span>";
    }
    if (i === 0 || i === 2 || i === 4 || i === 6 || i === 9) {
      html += '<span class="cd-sep"> </span>';
    }
  }
  codeDisplay.innerHTML = html;
}

// dob input
// note: type may be date, but we still normalize
const dobHandler = () => {
  let v = dobInput.value.trim();
  if (dobInput.type === "date") v = normalizeDateInput(v);

  if (v.length === 0) {
    dobInput.classList.remove("is-valid", "is-error");
    dobHint.textContent = "kuupäev kujul PP.KK.AAAA";
    dobHint.classList.remove("err");
    state.source = null;
    state.born = null;
    clearResults();
    return;
  }

  codeInput.value = "";
  codeInput.classList.remove("is-valid", "is-error");
  codeHint.textContent = "11-kohaline isikukood";
  codeHint.classList.remove("err");
  codeDisplay.innerHTML = "";
  codeClear.classList.remove("visible");
  state.idParsed = null;
  blockInfo.style.display = "none";
  blockChecksum.style.display = "none";

  const p = parseDMY(v);
  if (p) {
    dobInput.classList.add("is-valid");
    dobInput.classList.remove("is-error");
    dobHint.textContent = "kuupäev tuvastatud";
    dobHint.classList.remove("err");
    state.source = "dob";
    state.born = p;
    render();
  } else {
    dobInput.classList.add("is-error");
    dobInput.classList.remove("is-valid");
    dobHint.textContent = "kuupäev kujul PP.KK.AAAA · nt 03.05.1990";
    dobHint.classList.add("err");
    state.source = null;
    state.born = null;
    clearResults();
  }
};
dobInput.addEventListener("input", dobHandler);

// render functions
function clearResults() {
  ageContent.innerHTML = '<div class="idle-state">// ootab sisendit</div>';
  blockInfo.style.display = "none";
  blockChecksum.style.display = "none";
}

function render() {
  if (!state.born) {
    clearResults();
    return;
  }
  const born = state.born;
  const ref = state.ref;

  const td = totalDays(born, ref);

  if (td < 0) {
    ageContent.innerHTML =
      '<div class="idle-state" style="color:var(--red)">// arvutuskuupäev on enne sünnikuupäeva</div>';
  } else {
    const age = calcAge(born, ref);
    const isToday =
      ref.y === todayDMY().y &&
      ref.m === todayDMY().m &&
      ref.d === todayDMY().d;
    const refLabel = isToday ? "täna" : fmtDMY(ref);

    const isBirthday = ref.m === born.m && ref.d === born.d;
    const nextBirthday = (() => {
      let ny = ref.y;
      const thisBD = new Date(ref.y, born.m - 1, born.d);
      const refDt = new Date(ref.y, ref.m - 1, ref.d);
      if (thisBD <= refDt && !isBirthday) ny++;
      else if (isBirthday) ny++;
      const bd = new Date(ny, born.m - 1, born.d);
      const daysUntil = Math.floor((bd - refDt) / 86400000);
      return { date: { y: ny, m: born.m, d: born.d }, daysUntil };
    })();

    let detailParts = [];
    if (age.months > 0 || age.days > 0) {
      detailParts.push(age.months + " kuud, " + age.days + " päeva");
    }
    detailParts.push("kokku " + td.toLocaleString("et-EE") + " päeva");
    const detail = detailParts.join(" · ");

    let bdNote = "";
    if (isBirthday) {
      bdNote =
        '<div class="age-detail" style="color:var(--amber)">// sünnipäev</div>';
    } else {
      bdNote =
        '<div class="age-detail" style="color:var(--dim)">järgmine sünnipäev: ' +
        fmtDMY(nextBirthday.date) +
        " (" +
        nextBirthday.daysUntil +
        " päeva pärast)</div>";
    }

    ageContent.innerHTML =
      '<div class="age-main">' +
      '<span class="age-number">' +
      age.years +
      "</span>" +
      '<span class="age-unit">aastat ' +
      (isToday ? "" : "(" + refLabel + ")") +
      "</span>" +
      "</div>" +
      '<div class="age-detail">' +
      detail +
      "</div>" +
      bdNote;
  }

  if (state.idParsed) {
    const p = state.idParsed;
    const sexLabel = p.sex === "M" ? "mees" : "naine";
    const rows = [
      { k: "Sünniaeg", v: fmtDMY(born), cls: "" },
      { k: "Sugu", v: sexLabel, cls: "" },
      {
        k: "Sajand",
        v: p.century + "–" + (p.century + 99),
        cls: "muted",
      },
      {
        k: "Järjenumber",
        v: String(p.seq).padStart(3, "0"),
        cls: "muted",
      },
      {
        k: "Kontrollnr",
        v:
          p.chk +
          (p.checksumOk
            ? " ✓"
            : " ✗ — oodati " + (p.checkSum % 11 < 10 ? p.checkSum % 11 : 0)),
        cls: p.checksumOk ? "amber" : "err",
      },
    ];
    infoRows.innerHTML = rows
      .map(
        (r) =>
          '<div class="info-row">' +
          '<span class="info-key">' +
          r.k +
          "</span>" +
          '<span class="info-val ' +
          r.cls +
          '">' +
          r.v +
          "</span>" +
          "</div>",
      )
      .join("");
    blockInfo.style.display = "";

    const p10 = p.digits.slice(0, 10);
    const wts = p.usedWeights;
    const prods = p.checkProducts;
    const sum = p.checkSum;
    const rem = sum % 11;
    const finalChk = rem < 10 ? rem : 0;

    let thHtml =
      "<tr>" +
      p10.map((_, i) => "<th>" + (i + 1) + "</th>").join("") +
      "<th>—</th></tr>";
    let digitHtml =
      '<tr class="row-digit">' +
      p10.map((d) => "<td>" + d + "</td>").join("") +
      '<td class="cell-check">' +
      p.chk +
      "</td></tr>";
    let weightHtml =
      '<tr class="row-weight">' +
      wts.map((w) => "<td>×" + w + "</td>").join("") +
      "<td></td></tr>";
    let prodHtml =
      '<tr class="row-prod">' +
      prods.map((pr) => "<td>" + pr + "</td>").join("") +
      "<td></td></tr>";

    const weightsLabel = p.usedWeights.every(
      (v, i) => v === [1, 2, 3, 4, 5, 6, 7, 8, 9, 1][i],
    )
      ? "1. kaal"
      : "2. kaal";
    checksumContent.innerHTML =
      '<table class="checksum-table">' +
      thHtml +
      digitHtml +
      weightHtml +
      prodHtml +
      "</table>" +
      '<div class="checksum-sum">∑ = ' +
      prods.join("+") +
      " = <span>" +
      sum +
      "</span> · " +
      sum +
      " mod 11 = <span>" +
      rem +
      "</span>" +
      (rem >= 10 ? " → 0" : "") +
      ' → kontrollnumber = <span class="' +
      (p.checksumOk ? "ok" : "err") +
      '">' +
      finalChk +
      "</span>" +
      (p.checksumOk ? "" : " (tegelik: " + p.chk + ")") +
      "</div>";

    blockChecksum.style.display = "";
  } else {
    blockInfo.style.display = "none";
    blockChecksum.style.display = "none";
  }
}

// bootstrap
setFooterYear();
refInput.placeholder = fmtDMY(todayDMY());
