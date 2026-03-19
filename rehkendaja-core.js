// ── rehkendaja-core.js ───────────────────────────────────────────────────────
// Pure detection and formatting logic.
// Shared between rehkendaja.html and rehkendaja-test.html.
// No DOM access. No side effects.
// ─────────────────────────────────────────────────────────────────────────────

// ── Unit mode ────────────────────────────────────────────────────────────────
// 'eur' | 'g' | 'n'
// Mutable so rehkendaja.html can set it and tests can override it per case.
let mode = "eur";

// ── Regex patterns ────────────────────────────────────────────────────────────
//
// Euro (number-first or currency-first):
//   1 234,56 €  /  € 1 234,56  /  1234.56 EUR  /  1 234,56 eurot
//
// Gram (number-first only — grams are never written "g 1.5"):
//   1,5 g  /  1.5 g  /  12 grammi  /  1 gramm  /  0,5g
//
// Num: any standalone number not immediately preceded/followed by another digit.

const EURO_RE =
  /((?:€|EUR|eurot|euro)\s*([\d][\d\s.,]*))|(([\d][\d\s.,]*)\s*(?:€|EUR|eurot|euro))/gim;
const NUM_RE = /(?<![\d,.])(\d[\d\s]*(?:[.,]\d+)*)(?!\d)/gim;
const GRAM_RE =
  /(([\d][\d\s.,]*)\s*(?:grammi|gramm|g)(?=[\s.,;:)\]}\n\r]|$))/gim;

function activeRe() {
  let re;
  if (mode === "eur") re = EURO_RE;
  else if (mode === "g") re = GRAM_RE;
  else re = NUM_RE;
  re.lastIndex = 0;
  return re;
}

// ── Parsing ───────────────────────────────────────────────────────────────────
// Normalises Estonian/European number strings to a JS float.
// Handles: "1 234,56" "1.234,56" "1,234.56" "1234.56" "1234,56"
function parseAmount(raw) {
  let s = raw.replace(/\s/g, "");
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // Whichever separator appears last is the decimal separator.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", "."); // 1.234,56 → 1234.56
    } else {
      s = s.replace(/,/g, ""); // 1,234.56 → 1234.56
    }
  } else if (hasComma) {
    s = s.replace(",", "."); // 1234,56  → 1234.56
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ── Decimal counting ──────────────────────────────────────────────────────────
// Returns the number of decimal digits in a raw numeric string.
// Uses the rightmost separator (comma or dot) as the decimal point.
function countDecimals(raw) {
  const s = raw.replace(/\s/g, "");
  const di = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  if (di === -1) return 0;
  return s.length - di - 1;
}

// ── Extraction ────────────────────────────────────────────────────────────────
// Runs the active regex against text and returns an array of match objects:
//   { raw, amount, decimals, index, matchLen }
function extractAmounts(text) {
  const re = activeRe();
  const results = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    // Capture group layout:
    //   EURO_RE: group 2 = currency-first numeric, group 4 = number-first numeric
    //   GRAM_RE: group 2 = numeric part
    //   NUM_RE:  group 1 = full match
    const rawNum = (match[2] || match[4] || match[1] || "").trim();
    if (!rawNum) continue;
    const amount = parseAmount(rawNum);
    if (amount !== null && amount >= 0) {
      results.push({
        raw: rawNum,
        amount,
        decimals: countDecimals(rawNum),
        index: match.index,
        matchLen: match[0].length,
      });
    }
  }
  return results;
}

// ── Formatting ────────────────────────────────────────────────────────────────
// Shared inner formatter — returns a localised string without any unit suffix.
function _formatNumber(n, decimals) {
  if (mode === "eur") {
    return n.toLocaleString("et-EE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const d = decimals !== undefined ? Math.min(decimals, 10) : 10;
  return n.toLocaleString("et-EE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });
}

// Formats a number for display with the correct unit and locale.
// `decimals` controls precision for g and n modes (capped at 10).
function formatValue(n, decimals) {
  const s = _formatNumber(n, decimals);
  if (mode === "eur") return s + " €";
  if (mode === "g") return s + " g";
  return s;
}

// Returns the unit symbol for the zero/empty state.
function unitShort() {
  if (mode === "eur") return "€";
  if (mode === "g") return "g";
  return "";
}

// Formats a number for clipboard copy (no unit symbol).
function formatNumeric(n, decimals) {
  return _formatNumber(n, decimals);
}
