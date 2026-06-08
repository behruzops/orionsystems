/* ============================================================
   OrionSystems — standalone project page (project.html?id=<id>)
   Thin wrapper around window.ProjectView (shared with the in-page
   modal). Kept so direct links / new-tab fallback still work.
   ============================================================ */
(function () {
  const SUPPORTED = ["uz", "ru", "en"];
  let lang = localStorage.getItem("orionsys_lang");
  if (!SUPPORTED.includes(lang)) lang = "uz";

  const $ = (s) => document.querySelector(s);
  if (window.Store) Store.apply();

  const id = new URLSearchParams(location.search).get("id") || "oriondb";
  const project = DATA.projects.find((p) => p.id === id) || DATA.projects[0];

  const BACK = { uz: "Loyihalar", ru: "Проекты", en: "Projects" };

  function render() {
    document.documentElement.lang = lang;
    document.title = "OrionSystems — " + (project.name[lang] || project.name.uz);
    $("#back-label").textContent = BACK[lang];
    $("#year").textContent = new Date().getFullYear();
    $("#project-root").innerHTML = window.ProjectView.html(project, lang);
    document.querySelectorAll("#lang-switch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  }

  document.querySelectorAll("#lang-switch button").forEach((b) =>
    b.addEventListener("click", () => { lang = b.dataset.lang; localStorage.setItem("orionsys_lang", lang); render(); }));

  render();
})();
