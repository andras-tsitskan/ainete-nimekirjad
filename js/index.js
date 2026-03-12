import { esc, highlight } from "./utils.js";
import { initSidebarToggle, setFooterYear, markActiveNav } from "./layout.js";

initSidebarToggle();
setFooterYear();
markActiveNav("index.html");

// the renderData and search logic from index.html
export function renderData(d) {
  const meta = d.meta || {};
  if (meta.effective_date) {
    document.getElementById("eff-display").textContent = meta.effective_date;
  }

  const DATA = {};
  for (const l of d.lists) {
    DATA[l.id] = l.substances;
  }

  for (let n = 1; n <= 6; n++) {
    const subs = DATA[n] || [];
    const tbody = document.getElementById("tbody" + n);
    tbody.innerHTML = "";
    subs.forEach((s, i) => {
      const tr = document.createElement("tr");
      tr.dataset.et = s.et.toLowerCase();
      tr.dataset.en = (s.en || "").toLowerCase();
      tr.innerHTML = `<td class="row-num">${String(i + 1).padStart(3, "0")}</td><td class="et-name">${esc(s.et)}</td><td class="en-name">${esc(s.en || "")}</td>`;
      tbody.appendChild(tr);
    });
    const u = n === 6 ? " rühma" : " ainet";
    document.getElementById("badge" + n).textContent = subs.length + u;
    document.getElementById("c" + n).textContent = subs.length;
  }

  initSearch(DATA);
  document.getElementById("loading").style.display = "none";
  document.getElementById("main-content").style.display = "";
}

function initSearch(DATA) {
  const inp = document.getElementById("search");
  const rc = document.getElementById("result-count");
  const clearBtn = document.getElementById("search-clear");

  function runSearch() {
    const q = inp.value.trim().toLowerCase();
    clearBtn.classList.toggle("visible", q.length > 0);
    let total = 0;

    for (let list = 1; list <= 6; list++) {
      const subs = DATA[list] || [];
      const tbody = document.getElementById("tbody" + list);
      const rows = tbody.querySelectorAll("tr");
      const section = document.getElementById("section" + list);
      const noRes = document.getElementById("no" + list);
      let vis = 0;

      rows.forEach((tr, idx) => {
        const match =
          !q || tr.dataset.et.includes(q) || tr.dataset.en.includes(q);
        tr.classList.toggle("hidden", !match);
        if (match) {
          vis++;
          total++;
          tr.cells[1].innerHTML = highlight(subs[idx].et, q);
          tr.cells[2].innerHTML = highlight(subs[idx].en || "", q);
        }
      });

      if (q) {
        if (vis === 0) section.classList.add("hidden");
        else section.classList.remove("hidden", "collapsed");
      } else {
        section.classList.remove("hidden");
      }

      noRes.classList.toggle("visible", vis === 0 && !!q);
      const u = list === 6 ? " rühma" : " ainet";
      document.getElementById("badge" + list).textContent = q
        ? `${vis}/${subs.length}`
        : subs.length + u;
      if (list === 6) {
        document.getElementById("list-vi-wrap").style.display =
          q && vis === 0 ? "none" : "";
      }
    }
    rc.textContent = q ? `${total} tulemust` : "";
  }

  inp.addEventListener("input", runSearch);
  clearBtn.addEventListener("click", () => {
    inp.value = "";
    inp.focus();
    runSearch();
  });
}

export function updateScrollMargins() {
  const topbarH = document
    .querySelector(".topbar")
    .getBoundingClientRect().height;
  const offset = topbarH + 28;
  document.querySelectorAll(".list-section").forEach((el) => {
    el.style.scrollMarginTop = offset + "px";
  });
}

// helpers used by inline attributes; expose globally for backward compatibility
export function toggleSection(n) {
  document.getElementById("section" + n).classList.toggle("collapsed");
}
export function expandSection(n) {
  document.getElementById("section" + n).classList.remove("collapsed");
}
// make available on window so onclick handlers still work
window.toggleSection = toggleSection;
window.expandSection = expandSection;

// bootstrap for index page
const yr = new Date().getFullYear();
setFooterYear();

window.addEventListener("resize", updateScrollMargins);
updateScrollMargins();

// fetch data (try compressed copy first; a build script can create data.json.gz)
async function loadData() {
  const tryFetch = async (url) => {
    const r = await fetch(url);
    if (r.ok) return r;
    throw new Error("HTTP " + r.status + " for " + url);
  };

  try {
    const r = await tryFetch("data.json.gz");
    return r.json();
  } catch {
    const r2 = await tryFetch("data.json");
    return r2.json();
  }
}

loadData()
  .then(renderData)
  .catch((err) => {
    document.getElementById("loading").innerHTML =
      `<p style="color:var(--red)">// viga andmete laadimisel: ${esc(err.message)}</p>` +
      `<p style="margin-top:8px;font-size:12px;color:var(--muted)">Veendu, et <code>data.json</code> (või pakkitud faili) asub samas kaustas.</p>`;
  });
