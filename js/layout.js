// Shared DOM helpers: sidebar toggle and footer year

export function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const togBtn = document.getElementById("sidebar-toggle");
  if (!sidebar || !overlay || !togBtn) return;

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("visible");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  }
  togBtn.addEventListener("click", () =>
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar(),
  );
  overlay.addEventListener("click", closeSidebar);
}

export function setFooterYear() {
  const yr = new Date().getFullYear();
  document
    .querySelectorAll(".footer-year")
    .forEach((el) => (el.textContent = yr));
}

// Call this once after the layout is available in the DOM.
// activeHref should be the value of the link that corresponds to the current page,
// e.g. "index.html" or "rehkendaja.html".
export function markActiveNav(activeHref) {
  const link = document.querySelector(`.nav-item[href="${activeHref}"]`);
  if (link) link.classList.add("active");
}
