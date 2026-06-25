/* =========================================================================
   DEMO-ONLY in-browser backend.
   Activates ONLY when config.demoMode === true. It replaces window.AICasesApi
   with a localStorage-backed mock that implements the full API contract, so the
   admin console + reader pages are fully clickable with NO server and NO login.

   Production note: leave config.demoMode = false and this file is inert.
   Reset demo data anytime from the console:  __demoReset()
   ========================================================================= */
(function () {
  const cfg = window.AICasesConfig || {};
  if (!cfg.demoMode) return;  // inert in production

  const LS = {
    cases: "demo:cases", comments: "demo:comments",
    likes: "demo:likes", subs: "demo:submissions", seedver: "demo:seedver", site: "demo:site"
  };

  // Editable site content (CMS). Mirrors the text currently shown on the reader pages.
  const DEFAULT_SITE = {
    eyebrow: "Primax & Tymphany · Work Smarter",
    title: "AI × 流程自動化案例集",
    subtitle: "從日常痛點出發，找到可複製的效率解法",
    heroCaption: "五個步驟，從共識開始，讓數據與 AI 驅動營運。每一步都需要 DTO / IT 陪跑。",
    funnelTitle: "如何實踐 AI 與自動化場景",
    funnelSub: "AI 落地分三階段，每階段 User 與 IT 的分工不同。點下方數字即可看對應階段案例。",
    rules: [
      { t: "機密不出網", d: "走內網 Azure OpenAI" },
      { t: "看案例 ≠ 自用授權", d: "先確認白名單" },
      { t: "有疑問問 DTO", d: "不確定先問再動" }
    ],
    gateTitle: "Prototype → Deploy 必經閘門",
    gateItems: ["帳號管控（誰能用、用哪些資料）", "資料分級 + DLP 外洩防護", "後端整合公司 IT 平台", "稽核軌跡完整可追溯"],
    toolsOk: ["M365 Copilot", "Azure OpenAI", "GitHub Copilot"],
    toolsNo: ["外部 AI 一律不可"],
    toolsMeta: "其他公開服務（ChatGPT / Claude / Gemini 等）一律不得處理公司資料",
    theme: "primax",
    features: { likes: true, comments: true, previewBanner: false }
  };
  const USER = "demo-user";
  const MULTI = ["input", "process", "output", "benefits"];

  const read = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const arr = v => Array.isArray(v) ? v : (typeof v === "string" && v.length ? v.split("\n").map(s => s.trim()).filter(Boolean) : []);
  const now = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0, 10);
  const err = (code, message, extra) => { const e = new Error(message); e.code = code; e.status = (code === "validation" ? 400 : 409); e.data = { error: Object.assign({ code, message }, extra || {}) }; return e; };

  // Cheap content fingerprint so the cached seed refreshes whenever the deployed
  // data/cases.json changes (id / publish_status / last_updated). Without this the
  // first-ever seed would be cached in localStorage forever and never pick up updates.
  function _fingerprint(seed) {
    const s = seed.map(c => `${c.id}:${c.publish_status || ""}:${c.last_updated || ""}`).join("|");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return seed.length + ":" + h;
  }

  async function ensureSeeded() {
    let seed = [], fp = null;
    try {
      const r = await fetch((cfg.previewDataUrl || "data/cases.json") + "?v=" + Date.now(), { cache: "no-store" });
      if (r.ok) { const d = await r.json(); seed = (d && d.cases) || []; fp = _fingerprint(seed); }
    } catch (e) { /* offline */ }
    // Offline (couldn't fetch): keep whatever is cached, if any.
    if (fp === null) { if (localStorage.getItem(LS.cases)) return; fp = "empty"; }
    // Cache is current for this data version → nothing to do.
    if (localStorage.getItem(LS.seedver) === fp && localStorage.getItem(LS.cases)) return;
    // (Re)seed cases from the snapshot; preserve user-local likes/comments/submissions.
    seed.forEach(c => MULTI.forEach(k => c[k] = arr(c[k])));
    write(LS.cases, seed);
    if (!localStorage.getItem(LS.comments)) write(LS.comments, []);
    if (!localStorage.getItem(LS.likes)) write(LS.likes, []);
    if (!localStorage.getItem(LS.subs)) write(LS.subs, [
      { id: 1, title: "（範例送件）會議記錄自動摘要", bg: "PMX-DTO", stage: "Prototype",
        tools: "Copilot", pain_point: "手動整理會議記錄耗時", submitter_name: "示範員工",
        review_status: "Pending", created_at: now() }
    ]);
    localStorage.setItem(LS.seedver, fp);
  }

  const live = s => s === "Active-Internal" || s === "Active-Published";

  // automation_type buckets — mirror AutoTypeVals in ApiEndpoints.cs.
  // "AI" is a legacy alias for "AI 應用"; "混合" (mixed) counts toward BOTH buckets.
  const isAiType = t => t === "AI 應用" || t === "AI" || t === "混合";
  const isAutoType = t => t === "自動化" || t === "混合";

  function summary(all) {
    const pool = all.filter(c => c.publish_status !== "Archived");
    const stages = ["Prototype", "Development", "Deploy"];
    const counts = {}, bd = {};
    stages.forEach(st => {
      const inS = pool.filter(c => c.stage_norm === st);
      counts[st] = inS.length;
      bd[st] = {
        active_internal: inS.filter(c => live(c.publish_status)).length,
        published: inS.filter(c => c.publish_status === "Active-Published").length,
        draft: inS.filter(c => c.publish_status === "Draft").length,
        published_ai: inS.filter(c => c.publish_status === "Active-Published" && isAiType(c.automation_type)).length,
        published_automation: inS.filter(c => c.publish_status === "Active-Published" && isAutoType(c.automation_type)).length
      };
    });
    return {
      non_archived_total: pool.length,
      archived: all.filter(c => c.publish_status === "Archived").length,
      funnel_counts: counts, funnel_breakdown: bd,
      pending_it_review: pool.filter(c => c.stage_norm === "Prototype" && c.publish_status === "Draft").length,
      pending_owner_tools: 0,
      active_internal_total: pool.filter(c => live(c.publish_status)).length,
      active_published_total: pool.filter(c => c.publish_status === "Active-Published").length
    };
  }

  function dto(c) {
    const likes = read(LS.likes, []);
    const comments = read(LS.comments, []);
    return Object.assign({}, c, {
      input: arr(c.input), process: arr(c.process), output: arr(c.output), benefits: arr(c.benefits),
      likeCount: likes.filter(l => l.caseId === c.id).length,
      likedByMe: likes.some(l => l.caseId === c.id && l.userKey === USER),
      commentCount: comments.filter(x => x.caseId === c.id && !x.hidden).length,
      etag: String(c._v || 1)
    });
  }

  const REQUIRED = ["id", "title", "bg", "company", "unit", "tools", "benefits_summary", "stage", "stage_norm", "pain_point", "sourcechannel"];
  function applyContent(target, src) {
    Object.keys(src).forEach(k => {
      if (k === "id" || k === "publish_status" || k === "publish_date" || k === "etag") return;
      target[k] = MULTI.includes(k) ? arr(src[k]) : src[k];
    });
    target.last_updated = today();
    target._v = (target._v || 1) + 1;
  }

  function toast(msg) {
    let t = document.getElementById("ix-toast");
    if (!t) { t = document.createElement("div"); t.id = "ix-toast"; t.className = "ix-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-show");
    clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  const Mock = {
    async me() { return { authenticated: true, isAdmin: cfg.previewIsAdmin !== false, user: { name: "DEMO 管理者", email: "demo@primax" }, csrfToken: "demo" }; },

    async getSite() {
      const s = read(LS.site, null);
      return s || DEFAULT_SITE;
    },

    async getCases(params) {
      await ensureSeeded();
      params = params || {};
      let rows = read(LS.cases, []).slice();
      const st = params.status || "published";
      if (st === "published") rows = rows.filter(c => c.publish_status === "Active-Published");
      else if (st === "internal") rows = rows.filter(c => live(c.publish_status));
      // "all" -> no status filter
      if (params.stage) rows = rows.filter(c => c.stage_norm === params.stage);
      if (params.company) rows = rows.filter(c => c.company === params.company);
      if (params.unit) rows = rows.filter(c => c.unit === params.unit);
      if (params.region) rows = rows.filter(c => c.region === params.region);
      if (params.q) {
        const q = String(params.q).toLowerCase();
        rows = rows.filter(c => [c.title, c.bg, c.tools, c.owner_name, c.benefits_summary].join(" ").toLowerCase().includes(q));
      }
      rows.sort((a, b) => String(b.last_updated || "").localeCompare(String(a.last_updated || "")));
      return { generated_at: now(), pipeline_summary: summary(read(LS.cases, [])), cases: rows.map(dto) };
    },

    async getCase(id) {
      await ensureSeeded();
      const c = read(LS.cases, []).find(x => x.id === id);
      if (!c) throw err("not_found", "not found");
      return dto(c);
    },

    async toggleLike(id) {
      const likes = read(LS.likes, []);
      const i = likes.findIndex(l => l.caseId === id && l.userKey === USER);
      let liked;
      if (i >= 0) { likes.splice(i, 1); liked = false; } else { likes.push({ caseId: id, userKey: USER }); liked = true; }
      write(LS.likes, likes);
      return { liked, likeCount: likes.filter(l => l.caseId === id).length };
    },

    async getComments(id, opt) {
      const list = read(LS.comments, []).filter(c => c.caseId === id && ((opt && opt.includeHidden) || !c.hidden));
      return { comments: list.map(c => ({ id: c.id, caseId: c.caseId, author: c.author, body: c.body, createdAt: c.createdAt, hidden: c.hidden })) };
    },
    async addComment(id, author, body) {
      const list = read(LS.comments, []);
      const c = { id: Date.now(), caseId: id, author, body, hidden: false, createdAt: now() };
      list.push(c); write(LS.comments, list);
      return c;
    },
    async submit(payload) {
      const list = read(LS.subs, []);
      const s = Object.assign({ id: Date.now(), review_status: "Pending", created_at: now() }, payload);
      list.push(s); write(LS.subs, list);
      return { id: s.id, review_status: s.review_status };
    },

    admin: {
      async stats() {
        await ensureSeeded();
        const all = read(LS.cases, []);
        const by = s => all.filter(c => c.publish_status === s).length;
        const byStage = s => all.filter(c => c.stage_norm === s).length;
        return {
          byStatus: { "Draft": by("Draft"), "Active-Internal": by("Active-Internal"), "Active-Published": by("Active-Published"), "Archived": by("Archived") },
          byStage: { "Prototype": byStage("Prototype"), "Development": byStage("Development"), "Deploy": byStage("Deploy") },
          pendingSubmissions: read(LS.subs, []).filter(s => s.review_status === "Pending").length,
          hiddenComments: read(LS.comments, []).filter(c => c.hidden).length
        };
      },
      async createCase(payload) {
        const all = read(LS.cases, []);
        const miss = REQUIRED.filter(k => !String(payload[k] || "").trim());
        if (miss.length) throw err("validation", "missing required fields", { fields: miss });
        if (all.some(c => c.id === payload.id)) throw err("conflict", "case id already exists");
        const c = Object.assign({}, payload, { _v: 1, last_updated: today() });
        MULTI.forEach(k => c[k] = arr(c[k]));
        if (!c.publish_status) c.publish_status = "Draft";
        all.push(c); write(LS.cases, all);
        return dto(c);
      },
      async updateCase(id, patch) {
        const all = read(LS.cases, []);
        const c = all.find(x => x.id === id);
        if (!c) throw err("not_found", "not found");
        applyContent(c, patch);  // never touches publish_status
        write(LS.cases, all);
        return dto(c);
      },
      async publish(id, to) {
        const all = read(LS.cases, []);
        const c = all.find(x => x.id === id);
        if (!c) throw err("not_found", "not found");
        if (to === "Active-Published") {
          if (!String(c.evidenceurl || "").trim())
            throw err("evidence_required", "EvidenceUrl required before Active-Published");
          const miss = REQUIRED.filter(k => !String(c[k] || "").trim());
          if (miss.length) throw err("validation", "complete required fields before publishing", { fields: miss });
        }
        c.publish_status = to;
        if (to === "Active-Published") { c.publish_date = now(); c.reviewer = "DEMO 管理者"; }
        c.last_updated = today();
        write(LS.cases, all);
        return dto(c);
      },
      async archive(id, reason) {
        const all = read(LS.cases, []);
        const c = all.find(x => x.id === id);
        if (!c) throw err("not_found", "not found");
        c.publish_status = "Archived"; c.archive_reason = reason; c.archive_date = now(); c.last_updated = today();
        write(LS.cases, all);
        return { ok: true };
      },
      async listSubmissions(status) {
        const list = read(LS.subs, []).filter(s => status === "all" || s.review_status.toLowerCase() === String(status || "pending").toLowerCase());
        return { submissions: list };
      },
      async approveSubmission(id) {
        const subs = read(LS.subs, []);
        const s = subs.find(x => String(x.id) === String(id));
        if (!s) throw err("not_found", "not found");
        const all = read(LS.cases, []);
        const caseId = (String(s.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "case") + "-" + id;
        const c = {
          id: caseId, title: s.title, bg: s.bg || "", company: "PMX", unit: "", tools: s.tools || "",
          benefits_summary: "", stage: s.stage || "", stage_norm: "Prototype", pain_point: s.pain_point || "",
          input: arr(s.input), process: arr(s.process), output: arr(s.output), benefits: arr(s.benefits),
          quote: s.quote || "", evidenceurl: s.evidenceurl || "", sourcechannel: "Form",
          publish_status: "Draft", last_updated: today(), _v: 1
        };
        all.push(c); write(LS.cases, all);
        s.review_status = "Approved"; s.promoted_case_id = caseId; write(LS.subs, subs);
        return dto(c);
      },
      async rejectSubmission(id, reason) {
        const subs = read(LS.subs, []);
        const s = subs.find(x => String(x.id) === String(id));
        if (s) { s.review_status = "Rejected"; s.reject_reason = reason; write(LS.subs, subs); }
        return { ok: true };
      },
      async moderateComment(id, hidden) {
        const list = read(LS.comments, []);
        const c = list.find(x => String(x.id) === String(id));
        if (c) { c.hidden = !!hidden; write(LS.comments, list); }
        return { id, hidden };
      },
      async listComments() {
        const cases = read(LS.cases, []);
        const titleOf = id => (cases.find(c => c.id === id) || {}).title || id;
        return { comments: read(LS.comments, []).slice().reverse().map(c => ({ id: c.id, caseId: c.caseId, caseTitle: titleOf(c.caseId), author: c.author, body: c.body, hidden: !!c.hidden, createdAt: c.createdAt })) };
      },
      async saveSite(site) {
        write(LS.site, site);
        return site;
      },
      async analytics() {
        const cases = read(LS.cases, []), likes = read(LS.likes, []), comments = read(LS.comments, []);
        const likeBy = id => likes.filter(l => l.caseId === id).length;
        const cmtBy = id => comments.filter(c => c.caseId === id && !c.hidden).length;
        const en = cases.map(c => ({ id: c.id, title: c.title, bg: c.bg, stageNorm: c.stage_norm, publish_status: c.publish_status, likes: likeBy(c.id), comments: cmtBy(c.id) }));
        const byBgMap = {};
        en.forEach(c => { const k = c.bg || "—"; (byBgMap[k] = byBgMap[k] || { bg: k, cases: 0, likes: 0, comments: 0 }); byBgMap[k].cases++; byBgMap[k].likes += c.likes; byBgMap[k].comments += c.comments; });
        return {
          totals: { cases: cases.length, published: cases.filter(c => c.publish_status === "Active-Published").length, totalLikes: likes.length, totalComments: comments.filter(c => !c.hidden).length, hiddenComments: comments.filter(c => c.hidden).length },
          topLiked: en.slice().sort((a, b) => b.likes - a.likes).slice(0, 10),
          topCommented: en.slice().sort((a, b) => b.comments - a.comments).slice(0, 10),
          byBg: Object.values(byBgMap).sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
        };
      },
      async importCases(cases) {
        await ensureSeeded();
        const all = read(LS.cases, []);
        const byId = Object.fromEntries(all.map(c => [c.id, c]));
        let created = 0, updated = 0; const errors = []; const seen = new Set();
        (cases || []).forEach(row => {
          const id = (row && row.id || "").trim();
          if (!id) { errors.push({ id: null, reason: "missing id" }); return; }
          if (seen.has(id)) { errors.push({ id, reason: "duplicate id in file" }); return; }
          seen.add(id);
          if (byId[id]) { applyContent(byId[id], row); updated++; }
          else {
            const miss = REQUIRED.filter(k => !String(row[k] || "").trim());
            if (miss.length) { errors.push({ id, reason: "missing: " + miss.join(",") }); return; }
            const c = Object.assign({}, row, { _v: 1, last_updated: today() });
            MULTI.forEach(k => c[k] = arr(c[k]));
            if (!c.publish_status) c.publish_status = "Draft";
            all.push(c); byId[id] = c; created++;
          }
        });
        write(LS.cases, all);
        return { created, updated, errorCount: errors.length, errors };
      }
    },
    _toast: toast
  };

  window.AICasesApi = Mock;

  // V4 public build: DEMO banner removed (per Glen). __demoReset() still
  // available from the console for resetting the local sample data.
  window.__demoReset = function () {
    [LS.cases, LS.comments, LS.likes, LS.subs, LS.seedver].forEach(k => localStorage.removeItem(k));
    location.reload();
  };
})();
