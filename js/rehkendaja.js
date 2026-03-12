import {
  parseAmount,
  extractAmounts,
  countDecimals,
  formatNumeric,
  unitShort,
} from "./rehkendaja-utils.js";
import { initSidebarToggle, setFooterYear, markActiveNav } from "./layout.js";

// initialization
initSidebarToggle();
setFooterYear();
markActiveNav("rehkendaja.html");

// ── Unit mode ───────────────────────────────────────────────────────────────
let mode = "eur";

const btnEur = document.getElementById("btn-eur");
const btnG = document.getElementById("btn-g");
const btnN = document.getElementById("btn-n");
const inputEl = document.getElementById("input-text");
const highlightEl = document.getElementById("input-highlight");

btnEur.addEventListener("click", () => setMode("eur"));
btnG.addEventListener("click", () => setMode("g"));
btnN.addEventListener("click", () => setMode("n"));

function setMode(m) {
  mode = m;
  btnEur.classList.toggle("active", m === "eur");
  btnG.classList.toggle("active", m === "g");
  btnN.classList.toggle("active", m === "n");
  inputEl.placeholder = "Sisesta siia tekst, mis sisaldab arve.";
  update();
}

// ── Highlight mirror ──────────────────────────────────────────────────────
inputEl.addEventListener("scroll", () => {
  highlightEl.scrollTop = inputEl.scrollTop;
  highlightEl.scrollLeft = inputEl.scrollLeft;
});

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHighlightHtml(text, matches) {
  if (!matches.length) return escHtml(text);
  let html = "",
    cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) html += escHtml(text.slice(cursor, m.index));
    html +=
      "<mark>" + escHtml(text.slice(m.index, m.index + m.matchLen)) + "</mark>";
    cursor = m.index + m.matchLen;
  }
  if (cursor < text.length) html += escHtml(text.slice(cursor));
  return html;
}

// ── Render ────────────────────────────────────────────────────────────────
const blockSum = document.getElementById("block-sum");
const blockCount = document.getElementById("block-count");
const blockList = document.getElementById("block-list");
const valSum = document.getElementById("val-sum");
const valCount = document.getElementById("val-count");
const valList = document.getElementById("val-list");

let lastFound = [];

function update() {
  const text = inputEl.value;
  lastFound = extractAmounts(text, mode);

  highlightEl.innerHTML = buildHighlightHtml(text + " ", lastFound);
  highlightEl.scrollTop = inputEl.scrollTop;

  const hasText = !!text.trim();
  if (!hasText) {
    valSum.textContent = "0";
    valCount.textContent = "0";
    valList.innerHTML = '<li style="color:var(--dim)">–</li>';
    return;
  }

  const maxDec = lastFound.reduce((m, x) => Math.max(m, x.decimals), 0);
  const total = lastFound.reduce((acc, x) => acc + x.amount, 0);
  valSum.textContent = lastFound.length
    ? formatValue(total, maxDec)
    : "0 " + unitShort(mode);
  valCount.textContent = lastFound.length;

  valList.innerHTML = "";
  if (lastFound.length === 0) {
    const li = document.createElement("li");
    li.style.cssText = "color:var(--dim);font-size:12px;letter-spacing:0.1em";
    li.textContent = "// ühtegi elementi ei leitud";
    valList.appendChild(li);
  } else {
    lastFound.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="el-num">' +
        String(i + 1).padStart(2, "0") +
        "</span>" +
        formatValue(item.amount, item.decimals);
      valList.appendChild(li);
    });
  }
}

function formatValue(n, decimals) {
  if (mode === "eur") {
    return (
      n.toLocaleString("et-EE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €"
    );
  } else if (mode === "g") {
    const d = decimals !== undefined ? Math.min(decimals, 10) : 10;
    return (
      n.toLocaleString("et-EE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: d,
      }) + " g"
    );
  } else {
    const d = decimals !== undefined ? Math.min(decimals, 10) : 10;
    return n.toLocaleString("et-EE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: d,
    });
  }
}

inputEl.addEventListener("input", update);

// ── Copy buttons ───────────────────────────────────────────────────────────
function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add("copied");
    const orig = btn.textContent;
    btn.textContent = "Kopeeritud \u2713";
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("copied");
    }, 1800);
  });
}

document.getElementById("copy-sum").addEventListener("click", () => {
  copyText(document.getElementById("copy-sum"), valSum.textContent);
});

document.getElementById("copy-list").addEventListener("click", () => {
  const text = lastFound
    .map((x) => formatNumeric(x.amount, mode, x.decimals))
    .join("\n");
  copyText(document.getElementById("copy-list"), text);
});

// ── Bootstrap ─────────────────────────────────────────────────────────────
setFooterYear();

// expose test data on window (unchanged)
window.rehkendajaTest = {
  text: [
    "Kohtuasi nr 1-23/456. Konfiskeeriti 0,5g heroiini ja 1.2g kokaiini.",
    "Täiendavalt leiti 12 grammi amfetamiini ning 0,0002g fentanüüli.",
    "Varalise kahju suurus on 1 234,56 € ning lisaks 89.50 € kulud.",
    "Trahv määrati summas EUR 500 ja täiendav makse 75,00 eurot.",
    "Analüüsi tulemus: 1 000,001g ainet kogumassiga, sh 3.14g lisainet.",
    "Väärtus oli €350 ja veel 1.234,56 EUR (kokku kaks summat).",
    "Leitud kogused: 7g, 0.003g ja 2 500g pulbrit.",
    "Protokollis märgitud arvud: 42, 1 000, 3,14 ja 0,0002.",
  ].join("\n"),

  expected: {
    eur: {
      items: ["1 234,56", "89.50", "500", "75,00", "350", "1.234,56"],
      values: [1234.56, 89.5, 500, 75.0, 350, 1234.56],
      sum: 3483.62,
      count: 6,
      note: "Sum: 1234.56 + 89.50 + 500 + 75.00 + 350 + 1234.56 = 3 483,62 €",
    },
    g: {
      items: [
        "0,5",
        "1.2",
        "12",
        "0,0002",
        "1 000,001",
        "3.14",
        "7",
        "0.003",
        "2 500",
      ],
      values: [0.5, 1.2, 12, 0.0002, 1000.001, 3.14, 7, 0.003, 2500],
      sum: 3523.8442,
      count: 9,
      note: "Sum: 0.5+1.2+12+0.0002+1000.001+3.14+7+0.003+2500 = 3 523,8442 g",
    },
    n: {
      note: "Catches all standalone numbers — sum is not semantically meaningful.",
    },
  },

  // Pastes test text into the input and runs detection in the current mode.
  run() {
    const ta = document.getElementById("input-text");
    ta.value = this.text;
    ta.dispatchEvent(new Event("input"));
    const exp = this.expected[mode];
    if (exp && exp.sum !== undefined) {
      console.group("rehkendajaTest — mode: " + mode);
      console.log("Expected sum:  ", exp.sum);
      console.log("Expected count:", exp.count);
      console.log("Expected items:", exp.items);
      console.log("Note:", exp.note);
      console.log(
        "Detected:",
        lastFound.map((x) => x.raw + " → " + x.amount),
      );
      const detectedSum =
        Math.round(lastFound.reduce((a, x) => a + x.amount, 0) * 1e10) / 1e10 ||
        0;
      console.log("Detected sum:", detectedSum);
      console.groupEnd();
    }
  },
};
