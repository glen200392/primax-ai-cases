/* =========================================================================
   Primax AI Cases — V4 STATIC BUILD for GitHub Pages (no backend).

   This is the public showcase copy. There is NO /api backend on GitHub Pages,
   so demoMode is forced TRUE: cases are read from data/cases.json and all
   interactions (likes / comments) are persisted in the visitor's browser
   localStorage via mock-api.js. A reader password gate (see auth.js) keeps
   casual visitors out. The admin console is NOT shipped in this build.

   NOTE: this file diverges intentionally from the IT-deploy copy. The
   IT-deploy version keeps demoMode=false (real Entra + /api backend).
   ========================================================================= */
window.AICasesConfig = {
  apiBase:  "/api",
  authBase: "/auth",

  demoMode:        true,    // GitHub Pages static build: in-browser mock backend.
  previewIsAdmin:  false,   // never expose admin on the public site.
  previewMode:     false,
  previewDataUrl:  "data/cases.json",

  previewReaderPassword: "DTO"   // reader gate password (change here if needed).
};

/* Local-only demo switch (localhost + ?demo=1, persisted for the session).
   Inert on any real internal-server host. */
(function () {
  var c = window.AICasesConfig;
  if (c.demoMode) return;
  var host = location.hostname;
  var isLocal = host === "127.0.0.1" || host === "localhost" || host === "";
  if (!isLocal) return;
  var on = new URLSearchParams(location.search).get("demo") === "1"
        || sessionStorage.getItem("aicases:demo") === "1";
  if (on) { c.demoMode = true; c.previewIsAdmin = true; sessionStorage.setItem("aicases:demo", "1"); }
})();
