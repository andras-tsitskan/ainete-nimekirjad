// Utility routines for the "rehkendaja" tool

// Regex patterns (exported so they can be tested)
export const EURO_RE =
  /((?:€|EUR|eurot|euro)\s*([\d][\d\s.,]*))|(([\d][\d\s.,]*)\s*(?:€|EUR|eurot|euro))/gim;
export const NUM_RE = /(?<![\d,.])(\d[\d\s]*(?:[.,]\d+)*)(?!\d)/gim;
export const GRAM_RE =
  /(([\d][\d\s.,]*)\s*(?:grammi|gramm|g)(?=[\s.,;:)\]}\n\r]|$))/gim;

export function activeRe(mode) {
  let re;
  if (mode === "eur") re = EURO_RE;
  else if (mode === "g") re = GRAM_RE;
  else re = NUM_RE;
  re.lastIndex = 0;
  return re;
}

export function parseAmount(raw) {
  let s = raw.replace(/\s/g, "");
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(/,/g, ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function extractAmounts(text, mode) {
  const re = activeRe(mode);
  const results = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    // Euro: group 2 (currency-first numeric) or group 4 (number-first numeric)
    // Gram: group 2 · Numbers: group 1
    const rawNum = (match[2] || match[4] || match[1] || "").trim();
    if (!rawNum) continue;
    const amount = parseAmount(rawNum);
    if (amount !== null && amount >= 0) {
      results.push({ amount, raw: rawNum, decimals: countDecimals(rawNum) });
    }
  }
  return results;
}

export function countDecimals(raw) {
  const s = raw.replace(/\s/g, "");
  const di = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  if (di === -1) return 0;
  return s.length - di - 1;
}

// simple formatting helpers; these mirror the originals from the page script
export function unitShort(mode) {
  if (mode === "eur") return "€";
  if (mode === "g") return "g";
  return "";
}

export function formatNumeric(n, mode, decimals) {
  if (mode === "eur") {
    return n.toLocaleString("et-EE", {
      minimumFractionDigits: 2,
      maximumFractionDigits:
        decimals !== undefined ? Math.min(decimals, 10) : 10,
    });
  }
  const d = decimals !== undefined ? Math.min(decimals, 10) : 10;
  return n.toLocaleString("et-EE", {
    maximumFractionDigits: d,
  });
}
