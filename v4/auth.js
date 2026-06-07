/* =========================================================================
   Primax AI Cases — auth adapter (replaces the legacy auth-gate.js)

   Environment-aware:
   - PRODUCTION (served by the internal server): identity comes from Entra SSO
     via the backend. GET /api/me; if not authenticated, redirect to /auth/login.
   - PREVIEW (config.previewMode = true, no backend): identity is mocked; an
     optional reader password gate keeps casual viewers out of a static preview.

   IMPORTANT: client-side isAdmin is UX only. The server enforces authorization
   on every /api/admin/* call (see docs/04-auth-spec.md, section 5).
   ========================================================================= */
window.AICasesAuth = (function () {
  const cfg = window.AICasesConfig || {};
  const state = {
    ready: false,
    authenticated: false,
    user: null,         // { name, email, oid }
    isAdmin: false,
    csrfToken: null
  };

  async function init() {
    if (state.ready) return state;

    if (cfg.demoMode) {
      // V4 static build (GitHub Pages): gate casual visitors with the reader
      // password first, then run the fully-clickable in-browser mock backend.
      _previewReaderGate();
      state.authenticated = true;
      state.user = { name: "預覽使用者", email: "", oid: "demo" };
      state.isAdmin = cfg.previewIsAdmin !== false;
      state.csrfToken = "demo";
      state.ready = true;
      return state;
    }

    if (cfg.previewMode) {
      _previewReaderGate();
      state.authenticated = true;
      state.user = { name: "預覽使用者", email: "", oid: "preview" };
      state.isAdmin = !!cfg.previewIsAdmin;
      state.ready = true;
      return state;
    }

    // Production: ask the backend who we are.
    let me;
    try {
      const resp = await fetch((cfg.apiBase || "/api") + "/me", {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      me = await resp.json();
    } catch (e) {
      console.error("[auth] /api/me failed", e);
      me = { authenticated: false };
    }

    if (!me.authenticated) {
      // Kick off the OIDC login; come back to where we were.
      const ret = encodeURIComponent(location.pathname + location.search + location.hash);
      location.assign((cfg.authBase || "/auth") + "/login?returnUrl=" + ret);
      // Resolve a never-resolving promise visually; page is navigating away.
      return new Promise(() => {});
    }

    state.authenticated = true;
    state.user = me.user || null;
    state.isAdmin = !!me.isAdmin;
    state.csrfToken = me.csrfToken || null;
    state.preferredLang = me.preferredLanguage || null;
    // Surface the AD/Entra preferred language so i18n can default to it.
    if (me.preferredLanguage) window.__USER_LANG = me.preferredLanguage;
    state.ready = true;
    return state;
  }

  // Hard gate for admin.html. Returns true if admin; otherwise renders Access Denied.
  function requireAdmin() {
    if (state.isAdmin) return true;
    document.documentElement.style.overflow = "hidden";
    const o = document.createElement("div");
    o.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0D3338,#008C9A);" +
      "display:flex;align-items:center;justify-content:center;font-family:-apple-system,'Segoe UI','Microsoft JhengHei',sans-serif";
    o.innerHTML =
      '<div style="background:#fff;color:#1F2D33;padding:36px 44px;border-radius:16px;max-width:420px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.3)">' +
      '<div style="font-size:48px">⛔</div>' +
      '<h2 style="margin:8px 0 6px;font-size:20px">Access Denied</h2>' +
      '<p style="font-size:13px;color:#4F6670;line-height:1.6">此管理主控台僅供 DTO Office 管理者使用。<br>' +
      (state.user ? ("目前登入：" + escapeHtml(state.user.name || state.user.email || "")) : "") + "</p>" +
      '<a href="index.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#008C9A;color:#fff;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">回到案例集</a>' +
      "</div>";
    (document.body || document.documentElement).appendChild(o);
    return false;
  }

  function logout() {
    if (cfg.previewMode) { location.reload(); return; }
    location.assign((cfg.authBase || "/auth") + "/logout");
  }

  /* ---- preview-only reader password gate (no backend) ---- */
  function _previewReaderGate() {
    const KEY = "primax-ai-cases-preview-auth";
    if (!cfg.previewReaderPassword) return;
    if (sessionStorage.getItem(KEY) === "ok") return;
    // Synchronous-style gate using a blocking overlay + prompt loop is bad UX;
    // instead render an overlay and stop here is complex. For preview only, we use a
    // simple prompt; preview is a low-stakes static demo.
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) {
      const v = window.prompt("Primax AI 案例集 — 預覽密碼");
      if (v === null) break;
      ok = v === cfg.previewReaderPassword;
    }
    if (ok) sessionStorage.setItem(KEY, "ok");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { init, requireAdmin, logout, state };
})();
