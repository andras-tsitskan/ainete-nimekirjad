// Shared utility functions used across pages and tests

export function pad2(n) {
  return String(n).padStart(2, "0");
}

// Parse "DD.MM.YYYY" or ISO "YYYY-MM-DD" → { y, m, d } or null
export function parseDMY(s) {
  if (!s) return null;
  s = s.trim();
  // Try ISO first
  const iso = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  let m = s.match(iso);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    const dt = new Date(y, mo - 1, d);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo - 1 ||
      dt.getDate() !== d
    )
      return null;
    return { y, m: mo, d };
  }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10),
    mo = parseInt(m[2], 10),
    y = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d)
    return null;
  return { y, m: mo, d };
}

export function todayDMY() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

export function fmtDMY({ y, m, d }) {
  return pad2(d) + "." + pad2(m) + "." + y;
}

// Calculate full age between two {y,m,d} objects
export function calcAge(born, ref) {
  let years = ref.y - born.y;
  let months = ref.m - born.m;
  let days = ref.d - born.d;
  if (days < 0) {
    months--;
    const prevMonth = new Date(ref.y, ref.m - 1, 0); // last day of prev month
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

// Total days between two dates (ref - born)
export function totalDays(born, ref) {
  const a = new Date(born.y, born.m - 1, born.d);
  const b = new Date(ref.y, ref.m - 1, ref.d);
  return Math.floor((b - a) / 86400000);
}

// ---------------------------------------------------------------------------
// Estonian ID code parsing logic
const CENTURY_MAP = {
  1: { century: 1800, sex: "M" },
  2: { century: 1800, sex: "N" },
  3: { century: 1900, sex: "M" },
  4: { century: 1900, sex: "N" },
  5: { century: 2000, sex: "M" },
  6: { century: 2000, sex: "N" },
};

export function parseIdCode(code) {
  if (!/^\d{11}$/.test(code))
    return { valid: false, error: "Isikukood peab olema 11 numbrit" };

  const digits = code.split("").map(Number);
  const g = digits[0];
  const cm = CENTURY_MAP[g];
  if (!cm) return { valid: false, error: "Esimene number peab olema 1–6" };

  const yy = parseInt(code.slice(1, 3), 10);
  const mo = parseInt(code.slice(3, 5), 10);
  const dd = parseInt(code.slice(5, 7), 10);
  const seq = parseInt(code.slice(7, 10), 10);
  const chk = digits[10];
  const year = cm.century + yy;

  // Validate date
  const dt = new Date(year, mo - 1, dd);
  if (
    mo < 1 ||
    mo > 12 ||
    dd < 1 ||
    dd > 31 ||
    dt.getFullYear() !== year ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== dd
  ) {
    return { valid: false, error: "Isikukoodi kuupäev on vigane" };
  }

  // Checksum
  const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  const w2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
  const sum1 = digits.slice(0, 10).reduce((s, d, i) => s + d * w1[i], 0);
  let rem = sum1 % 11;
  let usedWeights = w1,
    checksumOk;
  if (rem < 10) {
    checksumOk = rem === chk;
  } else {
    const sum2 = digits.slice(0, 10).reduce((s, d, i) => s + d * w2[i], 0);
    rem = sum2 % 11;
    usedWeights = w2;
    checksumOk = rem < 10 ? rem === chk : chk === 0;
    if (rem >= 10) rem = 0;
  }

  return {
    valid: true,
    checksumOk,
    born: { y: year, m: mo, d: dd },
    sex: cm.sex,
    century: cm.century,
    seq,
    chk,
    digits,
    usedWeights,
    checkProducts: digits.slice(0, 10).map((d, i) => d * usedWeights[i]),
    checkSum: digits
      .slice(0, 10)
      .reduce((s, d, i) => s + d * usedWeights[i], 0),
  };
}

// ---------------------------------------------------------------------------
// HTML helpers used by the search logic in index.html
export function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlight(t, q) {
  if (!q) return esc(t);
  const re = new RegExp(
    "(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
    "gi",
  );
  return esc(t).replace(re, "<mark>$1</mark>");
}
