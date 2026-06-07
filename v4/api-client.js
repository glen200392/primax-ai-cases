/* =========================================================================
   Primax AI Cases — API client
   Thin wrapper over the REST contract (docs/02-api-contract.md). The reader
   pages and admin console use ONLY this module to reach the backend, so the
   backend can be reimplemented in any language without touching the frontend.

   In preview mode (no backend) GET /cases is served from a static cases.json
   and all writes are no-ops that surface a "preview - read only" toast.
   ========================================================================= */
window.AICasesApi = (function () {
  const cfg = window.AICasesConfig || {};
  const base = cfg.apiBase || "/api";

  function _csrf() {
    const a = window.AICasesAuth;
    return (a && a.state && a.state.csrfToken) || null;
  }

  async function _req(method, path, body, extraHeaders) {
    if (cfg.previewMode && method !== "GET") {
      _toast("預覽模式為唯讀，未連後端");
      throw new Error("preview-readonly");
    }
    const headers = { Accept: "application/json" };
    if (extraHeaders) Object.assign(headers, extraHeaders);
    const opts = { method, credentials: "include", headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    if (method !== "GET") {
      const t = _csrf();
      if (t) headers["X-CSRF-Token"] = t;
    }
    const resp = await fetch(base + path, opts);
    if (resp.status === 401) {
      // session expired -> re-login
      location.assign((cfg.authBase || "/auth") + "/login?returnUrl=" +
        encodeURIComponent(location.pathname + location.search));
      throw new Error("unauthenticated");
    }
    if (resp.status === 204) return null;
    const isJson = (resp.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await resp.json() : await resp.text();
    if (!resp.ok) {
      const msg = (data && data.error && data.error.message) || ("HTTP " + resp.status);
      const err = new Error(msg);
      err.status = resp.status;
      err.code = data && data.error && data.error.code;
      err.data = data;
      throw err;
    }
    return data;
  }

  /* ---------------- reader endpoints ---------------- */
  async function me() {
    if (cfg.previewMode) {
      return { authenticated: true, isAdmin: !!cfg.previewIsAdmin,
               user: { name: "預覽使用者" }, csrfToken: null };
    }
    return _req("GET", "/me");
  }

  async function getCases(params) {
    if (cfg.previewMode) return _previewCases();
    const q = _qs(params);
    return _req("GET", "/cases" + (q ? "?" + q : ""));
  }
  function getCase(id)            { return _req("GET", "/cases/" + encodeURIComponent(id)); }
  function toggleLike(id)         { return _req("POST", "/cases/" + encodeURIComponent(id) + "/like"); }
  function getComments(id, opt)   { return _req("GET", "/cases/" + encodeURIComponent(id) + "/comments" + (opt && opt.includeHidden ? "?includeHidden=1" : "")); }
  function addComment(id, author, body) { return _req("POST", "/cases/" + encodeURIComponent(id) + "/comments", { author, body }); }
  function submit(payload)        { return _req("POST", "/submissions", payload); }
  function getSite()              { return _req("GET", "/site"); }

  /* ---------------- admin endpoints ---------------- */
  const admin = {
    stats()                       { return _req("GET", "/admin/stats"); },
    createCase(payload)           { return _req("POST", "/admin/cases", payload); },
    updateCase(id, patch, etag) {
      // Optimistic concurrency: If-Match is REQUIRED by the server (428 if missing). Always send
      // it — note etag can legitimately be 0 (freshly seeded rows), so check for null/undefined,
      // not falsiness. Fall back to "*" if somehow unknown so the edit still goes through.
      var ifm = (etag === null || etag === undefined) ? "*" : String(etag);
      return _req("PATCH", "/admin/cases/" + encodeURIComponent(id), patch, { "If-Match": ifm });
    },
    publish(id, to)               { return _req("POST", "/admin/cases/" + encodeURIComponent(id) + "/publish", { to }); },
    archive(id, reason)           { return _req("POST", "/admin/cases/" + encodeURIComponent(id) + "/archive", { reason }); },
    listSubmissions(status)       { return _req("GET", "/admin/submissions?status=" + encodeURIComponent(status || "pending")); },
    approveSubmission(id)         { return _req("POST", "/admin/submissions/" + encodeURIComponent(id) + "/approve"); },
    rejectSubmission(id, reason)  { return _req("POST", "/admin/submissions/" + encodeURIComponent(id) + "/reject", { reason }); },
    moderateComment(id, hidden)   { return _req("PATCH", "/admin/comments/" + encodeURIComponent(id), { hidden }); },
    listComments()                { return _req("GET", "/admin/comments"); },
    analytics()                   { return _req("GET", "/admin/analytics"); },
    saveSite(site)                { return _req("PUT", "/admin/site", site); },
    importCases(cases)            { return _req("POST", "/admin/import", { cases }); },
    async upload(file) {
      // Real backend: multipart POST -> { url }. Demo: inline base64 data URL (no server).
      if (cfg.demoMode || cfg.previewMode) {
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
        });
        return { url: dataUrl };
      }
      const fd = new FormData(); fd.append("file", file);
      const headers = {};
      const t = _csrf(); if (t) headers["X-CSRF-Token"] = t;
      const resp = await fetch(base + "/admin/upload", { method: "POST", credentials: "include", headers, body: fd });
      if (!resp.ok) throw new Error("upload failed: HTTP " + resp.status);
      return resp.json();
    }
  };

  /* ---------------- helpers ---------------- */
  function _qs(params) {
    if (!params) return "";
    return Object.keys(params)
      .filter(k => params[k] != null && params[k] !== "")
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
      .join("&");
  }
  async function _previewCases() {
    const resp = await fetch((cfg.previewDataUrl || "data/cases.json") + "?v=" + Date.now(), { cache: "no-store" });
    if (!resp.ok) throw new Error("preview data not found");
    return resp.json();
  }
  function _toast(msg) {
    let t = document.getElementById("ix-toast");
    if (!t) { t = document.createElement("div"); t.id = "ix-toast"; t.className = "ix-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-show");
    clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  return { me, getCases, getCase, toggleLike, getComments, addComment, submit, getSite, admin, _toast };
})();
