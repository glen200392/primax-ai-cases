/* =========================================================
   Primax AI Cases v2 · Shared logic
   - Data fetch & state
   - Case card / modal render
   - Filter chips (Company/Unit/Region)
   - Sidebar funnel render
   - Floating chat widget (keyword search)
   ========================================================= */
let ALL_CASES = [];
let META = {};
let CURRENT_STAGE = null;          // null = overview page; else "Prototype"/"Development"/"Deploy"
let currentCaseId = null;          // for modal interaction
const state = { company: "ALL", unit: "ALL", region: "ALL", type: "ALL", scenario: "ALL", ecrs: "ALL", search: "" };

// Classification tags (type + scenario + ECRS) for cards / modal.
// Two-tier taxonomy (2026-06-10): automation_type (自動化/AI 應用) → scenario_tags (業務場景, multi)
// + module_tags (tech modules, derived from Tools at export time).
function ecrsList(c) { return c && c.ecrs ? String(c.ecrs).split(/[,+]/).map(s => s.trim()).filter(Boolean) : []; }  // tolerate legacy "E+S" and new "E,S"
const ECRS_NAME = { E: "刪除", C: "合併", R: "重排", S: "簡化" };  // letter -> 繁中 full name (i18n-translated for display)
function ecrsLabel(e) { return ECRS_NAME[e] ? `${e}·${T(ECRS_NAME[e])}` : e; }  // chip display "字母·全名" per Glen 2026-06-11
function scenarioList(c) { return (c && Array.isArray(c.scenario_tags)) ? c.scenario_tags : []; }
function moduleList(c) { return (c && Array.isArray(c.module_tags)) ? c.module_tags : []; }
function classTagsHtml(c, maxScn = 2) {
  let h = "";
  if (c.automation_type) {
    const t = c.automation_type;
    const cls = (t === "AI" || t === "AI 應用") ? "ai" : (t === "自動化" ? "auto" : "mix");
    h += `<span class="ctag ctag--${cls}">${escape(T(t))}</span>`;
  }
  scenarioList(c).slice(0, maxScn).forEach(s => h += `<span class="ctag ctag--scn">${escape(T(s))}</span>`);
  ecrsList(c).forEach(e => h += `<span class="ctag ctag--ecrs">${escape(ecrsLabel(e))}</span>`);
  return h;
}

/* ---------- utility ---------- */
function escape(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function T(s) { return window.AICasesI18n ? AICasesI18n.t(s) : s; }  // i18n for JS-rendered strings
function stageOf(c) { return (c && c.stage_norm) || "Other"; }
function stageBadgeClass(stage) {
  if (stage === "Prototype") return "stage-prototype";
  if (stage === "Development") return "stage-development";
  if (stage === "Deploy") return "stage-deploy";
  return "stage-other";
}
function stageLabel(stage) {
  return { Prototype: "Prototype", Development: "Development", Deploy: "Deploy" }[stage] || stage;
}
function showToast(msg) {
  let t = document.getElementById("ix-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "ix-toast";
    t.className = "ix-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.classList.remove("is-show"), 2000);
}

/* ---------- data fetch ---------- */
async function fetchData() {
  // Data comes from the API contract (docs/02-api-contract.md). Readers get the
  // published set; preview mode (no backend) falls back to data/cases.json.
  const payload = await AICasesApi.getCases({ status: "published" });
  META = payload || {};
  ALL_CASES = (payload && payload.cases) || [];
}

/* ---------- meta + preview banner ---------- */
function updateMetaBar() {
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText("meta-updated", `${T("更新日期")}：${META.generated_at ? META.generated_at.slice(0,10) : "—"}`);
  // Preview banner removed: stakeholder deploy no longer surfaces "internal preview / draft count"
}

/* ---------- sidebar funnel ---------- */
function renderSidebarFunnel() {
  const summary = META && META.pipeline_summary;
  if (!summary) return;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  // Main funnel big number = Active-Internal (matches what click-through shows)
  setText("funnel-total", summary.active_internal_total);
  setText("funnel-total-pipeline", summary.non_archived_total);
  const counts = summary.funnel_counts || {};
  const bd = summary.funnel_breakdown || {};
  for (const stage of ["Prototype", "Development", "Deploy"]) {
    const prefix = `funnel-${stage.toLowerCase()}`;
    const b = bd[stage] || {};
    // Big number = active_internal (= 子頁實際顯示的)
    setText(`${prefix}-count`, b.active_internal || 0);
    // Subtext = pipeline total + draft remainder
    setText(`${prefix}-total`, counts[stage] || 0);
    setText(`${prefix}-draft`, b.draft || 0);
    // Backward-compat (some pages may still reference -ai id)
    setText(`${prefix}-ai`, b.active_internal || 0);
  }
  setText("sec-pending-it", summary.pending_it_review);
  setText("sec-pending-owner", summary.pending_owner_tools);
  // Mark active funnel bar
  document.querySelectorAll(".funnel-bar").forEach(b => {
    b.classList.toggle("is-active", b.dataset.stage === CURRENT_STAGE);
  });
}

/* ---------- card render ---------- */
function buildCard(c) {
  const card = document.createElement("button");
  card.className = "case-card";
  card.type = "button";
  card.setAttribute("aria-label", `查看 ${c.bg || ""} ${c.title || ""} 詳情`);
  const ownerHtml = c.owner_name
    ? `<div class="case-card__owner">${escape(c.owner_name)}${c.owner_dept ? " · " + escape(c.owner_dept) : ""}</div>`
    : "";
  const stage = stageOf(c);
  card.innerHTML = `
    <div class="case-card__header">
      <span class="case-card__badge">${escape(c.bg)}</span>
      <span class="stage-badge ${stageBadgeClass(stage)}">${escape(stageLabel(stage))}</span>
    </div>
    ${classTagsHtml(c) ? `<div class="case-card__tags">${classTagsHtml(c)}</div>` : ""}
    <h3 class="case-card__title">${escape(c.title)}</h3>
    <div class="case-card__row">
      <span class="case-card__row-label">Tools</span>
      <span class="case-card__row-value">${escape(c.tools || "—")}</span>
    </div>
    ${ownerHtml}
    <div class="case-card__benefits">
      <div class="case-card__benefits-label">效益亮點</div>
      <div class="case-card__benefits-value">${escape(c.benefits_summary || "—")}</div>
    </div>
  `;
  card.addEventListener("click", () => openModal(c.id));
  return card;
}

/* ---------- filters ---------- */
function poolForFilters() {
  // Subset for filter chip pool — restrict to current stage if on sub-page.
  return CURRENT_STAGE
    ? ALL_CASES.filter(c => stageOf(c) === CURRENT_STAGE)
    : ALL_CASES;
}
function poolForUnit() {
  return poolForFilters().filter(c => state.company === "ALL" || c.company === state.company);
}
function poolForRegion() {
  return poolForUnit().filter(c => state.unit === "ALL" || c.unit === state.unit);
}

function clearChips(row) {
  Array.from(row.querySelectorAll(".filter-chip")).forEach(c => c.remove());
}
function makeChip(label, count, isActive, onClick) {
  const chip = document.createElement("button");
  chip.className = "filter-chip" + (isActive ? " is-active" : "");
  chip.textContent = count != null ? `${label} (${count})` : label;
  chip.onclick = onClick;
  return chip;
}
function renderFilters() {
  const row = (id) => document.getElementById(id);
  if (!row("filter-row-company")) return; // page has no toolbar (e.g. cases.html overview)

  // Company
  clearChips(row("filter-row-company"));
  const cPool = poolForFilters();
  const cVals = ["ALL", ...Array.from(new Set(cPool.map(c => c.company).filter(Boolean))).sort()];
  cVals.forEach(v => {
    const count = v === "ALL" ? cPool.length : cPool.filter(c => c.company === v).length;
    if (v !== "ALL" && count === 0) return;
    row("filter-row-company").appendChild(makeChip(
      v === "ALL" ? T("全部") : v, count, state.company === v, () => {
        state.company = v; state.unit = "ALL"; state.region = "ALL";
        renderFilters(); renderCasesGrid();
      }
    ));
  });

  // Unit
  clearChips(row("filter-row-unit"));
  const uPool = poolForUnit();
  const uVals = ["ALL", ...Array.from(new Set(uPool.map(c => c.unit).filter(Boolean))).sort()];
  uVals.forEach(v => {
    const count = v === "ALL" ? uPool.length : uPool.filter(c => c.unit === v).length;
    if (v !== "ALL" && count === 0) return;
    row("filter-row-unit").appendChild(makeChip(
      v === "ALL" ? T("全部") : v, count, state.unit === v, () => {
        state.unit = v; state.region = "ALL";
        renderFilters(); renderCasesGrid();
      }
    ));
  });

  // Region
  clearChips(row("filter-row-region"));
  const rPool = poolForRegion();
  const realRegions = Array.from(new Set(rPool.map(c => c.region).filter(r => r && r.trim()))).sort();
  ["ALL", ...realRegions].forEach(v => {
    const count = v === "ALL" ? rPool.length : rPool.filter(c => c.region === v).length;
    if (v !== "ALL" && count === 0) return;
    row("filter-row-region").appendChild(makeChip(
      v === "ALL" ? T("全部") : v, count, state.region === v, () => {
        state.region = v;
        renderFilters(); renderCasesGrid();
      }
    ));
  });

  // Type + ECRS (classification tag filters) — rows injected if absent.
  _ensureClassFilterRows();
  const fPool = poolForFilters();
  if (row("filter-row-type")) {
    clearChips(row("filter-row-type"));
    const types = Array.from(new Set(fPool.map(c => c.automation_type).filter(Boolean))).sort();
    row("filter-row-type").style.display = types.length ? "" : "none";
    if (types.length) ["ALL", ...types].forEach(v => {
      const count = v === "ALL" ? fPool.length : fPool.filter(c => c.automation_type === v).length;
      if (v !== "ALL" && count === 0) return;
      row("filter-row-type").appendChild(makeChip(v === "ALL" ? T("全部") : T(v), count, state.type === v, () => {
        state.type = v; renderFilters(); renderCasesGrid();
      }));
    });
  }
  if (row("filter-row-scenario")) {
    clearChips(row("filter-row-scenario"));
    const scns = Array.from(new Set(fPool.flatMap(c => scenarioList(c)))).sort();
    row("filter-row-scenario").style.display = scns.length ? "" : "none";
    if (scns.length) ["ALL", ...scns].forEach(v => {
      const count = v === "ALL" ? fPool.length : fPool.filter(c => scenarioList(c).includes(v)).length;
      if (v !== "ALL" && count === 0) return;
      row("filter-row-scenario").appendChild(makeChip(v === "ALL" ? T("全部") : T(v), count, state.scenario === v, () => {
        state.scenario = v; renderFilters(); renderCasesGrid();
      }));
    });
  }
  if (row("filter-row-ecrs")) {
    clearChips(row("filter-row-ecrs"));
    const letters = ["E", "C", "R", "S"].filter(L => fPool.some(c => ecrsList(c).includes(L)));
    row("filter-row-ecrs").style.display = letters.length ? "" : "none";
    if (letters.length) ["ALL", ...letters].forEach(v => {
      const count = v === "ALL" ? fPool.length : fPool.filter(c => ecrsList(c).includes(v)).length;
      row("filter-row-ecrs").appendChild(makeChip(v === "ALL" ? T("全部") : ecrsLabel(v), count, state.ecrs === v, () => {
        state.ecrs = v; renderFilters(); renderCasesGrid();
      }));
    });
  }
}

function _ensureClassFilterRows() {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;
  const regionRow = document.getElementById("filter-row-region");
  if (!document.getElementById("filter-row-type")) {
    const r = document.createElement("div");
    r.className = "filter-row"; r.id = "filter-row-type";
    r.innerHTML = `<span class="filter-bar__label">${T("類型")}：</span>`;
    bar.insertBefore(r, regionRow ? regionRow.nextSibling : null);
  }
  if (!document.getElementById("filter-row-scenario")) {
    const r = document.createElement("div");
    r.className = "filter-row"; r.id = "filter-row-scenario";
    r.innerHTML = `<span class="filter-bar__label">${T("場景")}：</span>`;
    const typeRow = document.getElementById("filter-row-type");
    bar.insertBefore(r, typeRow ? typeRow.nextSibling : null);
  }
  if (!document.getElementById("filter-row-ecrs")) {
    const r = document.createElement("div");
    r.className = "filter-row"; r.id = "filter-row-ecrs";
    r.innerHTML = `<span class="filter-bar__label">ECRS：</span>`;
    const scnRow = document.getElementById("filter-row-scenario");
    bar.insertBefore(r, scnRow ? scnRow.nextSibling : null);
  }
}

function matchesFilter(c) {
  if (CURRENT_STAGE && stageOf(c) !== CURRENT_STAGE) return false;
  if (state.company !== "ALL" && c.company !== state.company) return false;
  if (state.unit !== "ALL" && c.unit !== state.unit) return false;
  if (state.region !== "ALL" && c.region !== state.region) return false;
  if (state.type !== "ALL" && (c.automation_type || "") !== state.type) return false;
  if (state.scenario !== "ALL" && !scenarioList(c).includes(state.scenario)) return false;
  if (state.ecrs !== "ALL" && !ecrsList(c).includes(state.ecrs)) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = [c.bg, c.title, c.tools, c.benefits_summary, c.owner_name, c.stage].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderCasesGrid() {
  const grid = document.getElementById("cases-grid");
  if (!grid) return;
  const visible = ALL_CASES.filter(matchesFilter);
  grid.innerHTML = "";
  const metaCount = document.getElementById("meta-count");
  if (metaCount) {
    const label = CURRENT_STAGE ? `${CURRENT_STAGE} ${T("案例")}` : T("案例總數");
    metaCount.textContent = `${label}：${visible.length} / ${poolForFilters().length}`;
  }
  if (visible.length === 0) {
    const summary = META && META.pipeline_summary;
    const totals = summary ? summary.funnel_counts : null;
    const allInStage = CURRENT_STAGE && totals ? (totals[CURRENT_STAGE] || 0) : 0;
    const pendingNote = CURRENT_STAGE === "Prototype" && summary
      ? `（${summary.pending_it_review} ${T("案在 IT review queue 等接管")}）` : "";
    grid.innerHTML = CURRENT_STAGE
      ? `<div class="stage-empty">${T("此階段目前")} <strong>0</strong> ${T("案已上架；全集團共")} <strong>${allInStage}</strong> ${T("案在此階段")}${pendingNote}</div>`
      : `<div class="empty-state">${T("沒有符合條件的案例")}</div>`;
    return;
  }
  visible.forEach(c => grid.appendChild(buildCard(c)));
}

/* ---------- modal (L3 case detail) ---------- */
const backdrop = () => document.getElementById("modal-backdrop");
const closeBtn = () => document.getElementById("modal-close");

function renderList(items) {
  if (typeof items === "string") return `<p>${escape(items)}</p>`;
  if (!items || !items.length) return "";
  return "<ul>" + items.map(i => `<li>${escape(i)}</li>`).join("") + "</ul>";
}
function renderSection(icon, title, content) {
  return `
    <section class="ipo-section">
      <div class="ipo-section__heading">
        <span class="ipo-section__icon">${icon}</span>
        <h4 class="ipo-section__title">${title}</h4>
      </div>
      <div class="ipo-section__body">${content}</div>
    </section>`;
}
function openModal(id) {
  const c = ALL_CASES.find(x => x.id === id);
  if (!c) return;
  currentCaseId = id;
  const setText = (eid, v) => { const el = document.getElementById(eid); if (el) el.textContent = v; };

  document.getElementById("modal-badges").innerHTML = `
    <span class="modal__badge">${escape(c.bg)}</span>
    ${c.stage ? `<span class="modal__badge">${escape(c.stage)}</span>` : ""}
    ${c.category_matrix ? `<span class="modal__badge">${escape(c.category_matrix)}</span>` : ""}
    ${classTagsHtml(c, 3)}
    ${moduleList(c).map(m => `<span class="ctag ctag--mod">${escape(T(m))}</span>`).join("")}
  `;
  setText("modal-title", c.title || "");
  setText("modal-tools", c.tools || "");
  setText("modal-id", (c.id || "—").toUpperCase());
  setText("modal-src", c.source_meeting || "—");
  setText("modal-updated", c.last_updated || "—");

  const body = document.getElementById("modal-body");
  const parts = [];

  if (c.pain_point) parts.push(renderSection("①", T("痛點與情境"), `<p>${escape(c.pain_point)}</p>`));

  // ②/③ BEFORE → AFTER：兩條由左到右的 IPO 帶（對齊 L0 案例卡五層結構，2026-06-10）
  const hasIPO = (c.input && c.input.length) || (c.process && c.process.length)
              || (c.output && c.output.length) || c.before_how || c.after_how;
  if (hasIPO) {
    const bcol = (variant, label, inner) => `
        <div class="ipo-bcol ipo-bcol--${variant}">
          <div class="ipo-bcol__head">${label}</div>
          <div class="ipo-bcol__body">${inner || '<div class="ipo-col__empty">—</div>'}</div>
        </div>`;
    const band = (kind, sideLabel, inputHtml, processHtml, outputHtml) => `
      <section class="ipo-band ipo-band--${kind}">
        <div class="ipo-band__side">${sideLabel}</div>
        <div class="ipo-band__cols">
          ${bcol("input", T("INPUT · 輸入"), inputHtml)}
          ${bcol("process", T("PROCESS · 流程處理"), processHtml)}
          ${bcol("output", T("OUTPUT · 產出"), outputHtml)}
        </div>
      </section>`;
    const inputHtml = (c.input && c.input.length) ? renderList(c.input) : "";
    const beforeProc = c.before_how ? `<p>${escape(c.before_how)}</p>` : "";
    const beforeOut = c.before_pain ? `<p><strong>${T("痛點：")}</strong>${escape(c.before_pain)}</p>` : "";
    const afterProc = (c.process && c.process.length) ? renderList(c.process)
                    : (c.after_how ? `<p>${escape(c.after_how)}</p>` : "");
    const afterOut = ((c.output && c.output.length) ? renderList(c.output) : "")
                   + (c.after_outcome ? `<p class="ipo-bcol__note"><strong>${T("結果：")}</strong>${escape(c.after_outcome)}</p>` : "");
    parts.push(band("before", `② BEFORE`, inputHtml, beforeProc, beforeOut));
    if (c.tools) parts.push(`<div class="ipo-transition">⬇ ${T("導入")} ${escape(c.tools)}</div>`);
    parts.push(band("after", `③ AFTER`, inputHtml, afterProc, afterOut));
  }

  // ④ 效益評估
  if (c.benefits && c.benefits.length) {
    parts.push(`
      <div class="benefit-band">
        <div class="benefit-band__label">④ ${T("效益評估")}</div>
        <div class="benefit-band__body">${c.benefits.map(escape).join("　·　")}</div>
      </div>`);
  }

  // ⑤ 負責人心得（金句）
  if (c.quote) {
    parts.push(`
      <div class="note-band">
        <div class="note-band__label">⑤ ${T("負責人心得")}</div>
        <div class="note-band__body">「${escape(c.quote)}」${c.owner_name ? " — " + escape(c.owner_name) : ""}</div>
      </div>`);
  }

  if (c.build_story) {
    parts.push(`
      <div class="build-story">
        <div class="build-story__label">${T("⚙ 怎麼做出來的")}</div>
        <div class="build-story__body">${escape(c.build_story)}</div>
      </div>`);
  }

  if (c.owner_name) {
    const initials = (c.owner_name || "?").trim().charAt(0).toUpperCase();
    parts.push(`
      <div class="owner-card">
        <div class="owner-card__avatar">${escape(initials)}</div>
        <div class="owner-card__meta">
          <div class="owner-card__name">${escape(c.owner_name)}</div>
          <div class="owner-card__role">${escape(c.owner_role || "—")}${c.owner_dept ? " · " + escape(c.owner_dept) : ""}</div>
          ${c.owner_background ? `<div class="owner-card__bg">${escape(c.owner_background)}</div>` : ""}
          ${c.owner_email ? `<div class="owner-card__bg">📧 ${escape(c.owner_email)}</div>` : ""}
        </div>
      </div>`);
  }

  body.innerHTML = parts.join("");

  // Interaction bar (counts come from the case payload; comments load lazily)
  initInteractions(c);
  document.getElementById("comments-section").classList.remove("is-open");
  const lastName = localStorage.getItem("pmx-ai-cases:lastname");
  const nameEl = document.getElementById("comment-name");
  if (nameEl && lastName) nameEl.value = lastName;

  backdrop().classList.add("is-open");
  document.body.style.overflow = "hidden";
  history.replaceState(null, "", `#case=${c.id}`);
}
function closeModal() {
  backdrop().classList.remove("is-open");
  document.body.style.overflow = "";
  history.replaceState(null, "", window.location.pathname + window.location.search);
  currentCaseId = null;
}

/* ---------- localStorage interactions (demo only) ---------- */
function lsKey(prefix, id) { return `pmx-ai-cases:${prefix}:${id}`; }
function getLikes(id) {
  const v = localStorage.getItem(lsKey("likes", id));
  return v ? JSON.parse(v) : { count: 0, liked: false };
}
function toggleLike(id) {
  const cur = getLikes(id);
  if (cur.liked) { cur.count = Math.max(0, cur.count - 1); cur.liked = false; }
  else { cur.count += 1; cur.liked = true; }
  localStorage.setItem(lsKey("likes", id), JSON.stringify(cur));
  return cur;
}
function getComments(id) {
  const v = localStorage.getItem(lsKey("comments", id));
  return v ? JSON.parse(v) : [];
}
function addComment(id, name, text) {
  const list = getComments(id);
  list.push({ name, text, time: new Date().toISOString() });
  localStorage.setItem(lsKey("comments", id), JSON.stringify(list));
  return list;
}
/* ---------- API-aware interactions (likes + comments) ----------
   In production these call AICasesApi; in preview (no backend) they fall back
   to the localStorage demo helpers above. Server enforces auth on writes. */
const PREVIEW = !!(window.AICasesConfig && window.AICasesConfig.previewMode);

function initInteractions(c) {
  const likeCount = (c.likeCount != null) ? c.likeCount : getLikes(c.id).count;
  const liked = (c.likedByMe != null) ? c.likedByMe : getLikes(c.id).liked;
  document.getElementById("ix-like-count").textContent = likeCount;
  document.getElementById("ix-like").classList.toggle("is-active", liked);
  const cc = document.getElementById("ix-comments-count");
  if (cc) cc.textContent = (c.commentCount != null) ? c.commentCount : getComments(c.id).length;
  // Feature toggles (admin-controlled): hide like / comment if disabled.
  const feats = (window.__SITE && window.__SITE.features) || {};
  const likeBtn = document.getElementById("ix-like");
  const cmtBtn = document.getElementById("ix-comments-toggle");
  if (likeBtn) likeBtn.style.display = feats.likes === false ? "none" : "";
  if (cmtBtn) cmtBtn.style.display = feats.comments === false ? "none" : "";
}

async function doToggleLike(id) {
  if (PREVIEW) { const v = toggleLike(id); return { liked: v.liked, likeCount: v.count }; }
  try {
    const r = await AICasesApi.toggleLike(id);
    if (r && typeof r.likeCount === "number") return r;
  } catch (e) { showToast(T("操作失敗")); return null; }
  const cur = document.getElementById("ix-like").classList.contains("is-active");
  const n = (parseInt(document.getElementById("ix-like-count").textContent, 10) || 0) + (cur ? -1 : 1);
  return { liked: !cur, likeCount: Math.max(0, n) };
}

async function loadCommentsFor(id) {
  if (PREVIEW) return getComments(id).map(x => ({ author: x.name, body: x.text, createdAt: x.time }));
  try { const r = await AICasesApi.getComments(id); return (r && r.comments) || []; }
  catch (e) { return []; }
}
async function postCommentFor(id, author, body) {
  if (PREVIEW) { addComment(id, author, body); return; }
  await AICasesApi.addComment(id, author, body);
}
function renderComments(list) {
  const cntEl = document.getElementById("ix-comments-count");
  if (cntEl) cntEl.textContent = list.length;
  const wrap = document.getElementById("comments-list");
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px;font-style:italic">${escape(T("還沒有評論，第一個留言吧"))}</div>`;
    return;
  }
  wrap.innerHTML = list.slice().reverse().map(c => {
    const when = c.createdAt ? new Date(c.createdAt).toLocaleString("zh-TW", { hour12: false }) : "";
    return `
    <div style="padding:12px 14px;background:var(--bg-section-alt);border-radius:8px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="font-weight:700;color:var(--text-primary)">${escape(c.author)}</span>
        <span style="color:var(--text-muted)">${escape(when)}</span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">${escape(c.body)}</div>
    </div>`;
  }).join("");
}

function wireModalEvents() {
  closeBtn().onclick = closeModal;
  backdrop().onclick = e => { if (e.target === backdrop()) closeModal(); };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && backdrop().classList.contains("is-open")) closeModal();
  });
  document.getElementById("ix-like").addEventListener("click", async () => {
    if (!currentCaseId) return;
    const v = await doToggleLike(currentCaseId);
    if (!v) return;
    document.getElementById("ix-like-count").textContent = v.likeCount;
    document.getElementById("ix-like").classList.toggle("is-active", v.liked);
  });
  document.getElementById("ix-share").addEventListener("click", async () => {
    if (!currentCaseId) return;
    const url = `${window.location.origin}${window.location.pathname}#case=${currentCaseId}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Primax AI Case", url }); showToast(T("已開啟分享面板")); }
      else { await navigator.clipboard.writeText(url); showToast(T("✓ 連結已複製")); }
    } catch (err) { showToast(T("分享失敗") + "：" + err.message); }
  });
  document.getElementById("ix-comments-toggle").addEventListener("click", async () => {
    const sec = document.getElementById("comments-section");
    sec.classList.toggle("is-open");
    if (sec.classList.contains("is-open") && currentCaseId) {
      renderComments(await loadCommentsFor(currentCaseId));
    }
  });
  const form = document.getElementById("comment-form");
  if (form) form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!currentCaseId) return;
    const name = document.getElementById("comment-name").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    if (!name || !text) return;
    try {
      await postCommentFor(currentCaseId, name, text);
      document.getElementById("comment-text").value = "";
      localStorage.setItem("pmx-ai-cases:lastname", name);
      renderComments(await loadCommentsFor(currentCaseId));
      showToast(T("✓ 留言已送出"));
    } catch (err) { showToast(T("送出失敗") + "：" + err.message); }
  });
}

/* ---------- chat widget (keyword search) ---------- */
function tokenize(q) {
  if (!q) return [];
  const trimmed = q.trim().toLowerCase();
  const tokens = new Set();
  // Split by whitespace + punctuation
  trimmed.split(/[\s,，、。;.!?？！]+/).filter(Boolean).forEach(t => tokens.add(t));
  // CJK 2-char n-gram for stronger Chinese match
  const cjk = trimmed.replace(/[^一-鿿]/g, "");
  for (let i = 0; i + 2 <= cjk.length; i++) tokens.add(cjk.slice(i, i + 2));
  return Array.from(tokens).filter(t => t.length > 0);
}
function buildCorpus(c) {
  return [c.bg, c.unit, c.region, c.title, c.tools, c.benefits_summary,
          c.owner_name, c.owner_dept, c.stage, c.stage_norm, c.category_matrix,
          c.automation_type, scenarioList(c).join(" "), moduleList(c).join(" "),
          (c.input || []).join(" "), (c.process || []).join(" "),
          (c.output || []).join(" "), (c.benefits || []).join(" ")]
    .filter(Boolean).join(" ").toLowerCase();
}
function searchCases(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return ALL_CASES.map(c => {
    const corpus = buildCorpus(c);
    let score = 0;
    for (const t of tokens) {
      if (corpus.includes(t)) score += 1;
    }
    return { c, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.c);
}
function stagePageFor(stage) {
  return ({
    Prototype: "cases-prototype.html",
    Development: "cases-development.html",
    Deploy: "cases-deploy.html",
  })[stage] || "cases.html";
}

function appendChatMsg(html, who) {
  const body = document.getElementById("chat-body");
  if (!body) return;
  const msg = document.createElement("div");
  msg.className = `chat-msg chat-msg--${who}`;
  msg.innerHTML = html;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}
function handleChatQuery(q) {
  q = (q || "").trim();
  if (!q) return;
  appendChatMsg(escape(q), "user");
  const hits = searchCases(q);
  if (hits.length === 0) {
    appendChatMsg(`<strong>${escape(q)}</strong> — ${escape(T("找不到符合的案例，換個關鍵字試試（例如工具 / BG / Owner）"))}`, "bot");
    return;
  }
  let html = `<div class="chat-msg__header">🔍 ${escape(T("找到"))} ${hits.length} ${escape(T("個相關案例"))}</div>`;
  hits.forEach(c => {
    const stage = stageOf(c);
    const page = stagePageFor(stage);
    const tools = (c.tools || "").slice(0, 60);
    html += `
      <div class="chat-result">
        <div class="chat-result__title">
          <span class="stage-badge ${stageBadgeClass(stage)}">${escape(stageLabel(stage))}</span>
          ${escape(c.title)}
        </div>
        <div class="chat-result__meta">${escape(c.bg || "")} · ${escape(tools)}</div>
        <a class="chat-result__link" href="${page}#case=${escape(c.id)}">${escape(T("查看 →"))}</a>
      </div>`;
  });
  appendChatMsg(html, "bot");
}
function initChatWidget() {
  // v3: always-visible inline search form in sidebar; submit pops chat-panel as floating overlay
  const form = document.getElementById("sidebar-search-form");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const input = document.getElementById("chat-input-inline");
  if (!form || !panel || !input) return;

  closeBtn && closeBtn.addEventListener("click", () => {
    panel.classList.remove("is-open");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value;
    if (!q.trim()) return;
    const body = document.getElementById("chat-body");
    if (body) body.innerHTML = "";
    panel.classList.add("is-open");
    handleChatQuery(q);
  });
}

/* ---------- public entry: initPage ---------- */
function injectAdminLink() {
  // Show an Admin entry only for DTO admins (UX only; server enforces authz).
  // V4 public build: admin console is not shipped here, so never inject the link.
  return;
  /* eslint-disable no-unreachable */
  try {
    if (!(window.AICasesAuth && AICasesAuth.state && AICasesAuth.state.isAdmin)) return;
    document.querySelectorAll("nav.page-nav").forEach(nav => {
      if (nav.querySelector('[data-admin-link]')) return;
      const a = document.createElement("a");
      a.className = "page-nav__tab";
      a.href = "admin.html";
      a.setAttribute("data-admin-link", "1");
      a.textContent = "⚙ 管理";
      nav.appendChild(a);
    });
  } catch (e) { /* non-fatal */ }
}

// Inject editable site content (CMS) into the reader pages; reader text is no longer
// hardcoded — it comes from GET /api/site and admins edit it in the console.
async function applySiteContent() {
  let site;
  try { site = await AICasesApi.getSite(); } catch (e) { return; }
  if (!site) return;
  window.__SITE = site;
  const setTxt = (sel, v) => { if (v == null) return; document.querySelectorAll(sel).forEach(el => el.textContent = v); };
  setTxt(".page-header__eyebrow", site.eyebrow);
  setTxt(".page-header__title", site.title);
  setTxt(".page-header__subtitle", site.subtitle);
  setTxt(".hero-img-wrap__caption", site.heroCaption);
  setTxt(".funnel-card__title", site.funnelTitle);
  setTxt(".funnel-card__sub", site.funnelSub);
  const rulesOl = document.querySelector(".sidebar-card--rules ol.sidebar-card__list");
  if (rulesOl && Array.isArray(site.rules))
    rulesOl.innerHTML = site.rules.map(r => `<li><strong>${escape(r.t || "")}</strong>${r.d ? " — " + escape(r.d) : ""}</li>`).join("");
  setTxt(".sidebar-card--gate .sidebar-card__title-text", site.gateTitle);
  const gateUl = document.querySelector(".sidebar-card--gate ul.sidebar-card__list");
  if (gateUl && Array.isArray(site.gateItems))
    gateUl.innerHTML = site.gateItems.map(x => `<li>${escape(x)}</li>`).join("");
  const tagRow = document.querySelector(".sidebar-card--whitelist .sec-tag-row");
  if (tagRow)
    tagRow.innerHTML = (site.toolsOk || []).map(t => `<span class="security-tag security-tag--ok">${escape(t)}</span>`).join("")
      + (site.toolsNo || []).map(t => `<span class="security-tag security-tag--no">${escape(t)}</span>`).join("");
  setTxt(".sidebar-card--whitelist .sidebar-card__meta", site.toolsMeta);
}

// Brand theme resolution (auto-by-company):
//   1. user manual toggle (localStorage)   2. embed context ?org=pmx|tym
//   3. CMS default (site.theme)             4. primax
// PMX SharePoint embeds home.html?org=pmx (green); Tymphany SharePoint ?org=tym (blue).
function applyTheme() {
  const org = (new URLSearchParams(location.search).get("org") || "").toLowerCase();
  const orgTheme = (org === "tym" || org === "tymphany") ? "tymphany"
                 : (org === "pmx" || org === "primax") ? "primax" : null;
  const local = localStorage.getItem("aicases:theme");
  const fromSite = window.__SITE && window.__SITE.theme;
  const theme = local || orgTheme || fromSite || "primax";
  document.documentElement.dataset.theme = (theme === "tymphany") ? "tymphany" : "";
  document.querySelectorAll("nav.page-nav").forEach(nav => {
    if (nav.querySelector("[data-theme-toggle]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-theme-toggle", "1");
    b.className = "page-nav__tab";
    b.style.cssText = "cursor:pointer;border:none;background:rgba(255,255,255,.15)";
    const label = () => (document.documentElement.dataset.theme === "tymphany") ? "🎨 Tymphany" : "🎨 Primax";
    b.textContent = label();
    b.onclick = () => {
      const next = (document.documentElement.dataset.theme === "tymphany") ? "primax" : "tymphany";
      localStorage.setItem("aicases:theme", next);
      document.documentElement.dataset.theme = (next === "tymphany") ? "tymphany" : "";
      b.textContent = label();
    };
    nav.appendChild(b);
  });
}

// L2 page-config: show/hide + reorder page sections per backend config (site.sections).
// Each section element carries data-section="<id>"; config = { id: { on:bool, ord:number } }.
function applySections(site) {
  const secs = (site && site.sections) || null;
  if (!secs) return;
  document.querySelectorAll("[data-section]").forEach(el => {
    const cfg = secs[el.getAttribute("data-section")];
    el.style.display = (cfg && cfg.on === false) ? "none" : "";
  });
  const parents = new Set();
  document.querySelectorAll("[data-section]").forEach(el => { if (el.parentElement) parents.add(el.parentElement); });
  parents.forEach(p => {
    const kids = Array.from(p.children).filter(el => el.hasAttribute("data-section"));
    kids.sort((a, b) => {
      const oa = (secs[a.getAttribute("data-section")] || {}).ord; const ob = (secs[b.getAttribute("data-section")] || {}).ord;
      return (oa == null ? 99 : oa) - (ob == null ? 99 : ob);
    });
    kids.forEach(k => p.appendChild(k));
  });
}

async function initPage(stageOrNull) {
  CURRENT_STAGE = stageOrNull;
  try {
    // Establish identity first (Entra SSO in production; mocked in preview).
    if (window.AICasesAuth) { await AICasesAuth.init(); injectAdminLink(); }
    await applySiteContent();
    applyTheme();
    applySections(window.__SITE);
    await fetchData();
    updateMetaBar();
    renderSidebarFunnel();

    // Wire search input if present
    const searchEl = document.getElementById("search-input");
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        state.search = searchEl.value.trim();
        renderCasesGrid();
      });
    }

    // Wire modal
    if (document.getElementById("modal-backdrop")) {
      wireModalEvents();
    }

    // Render page-specific content (set up by each HTML)
    if (typeof window.renderPage === "function") {
      window.renderPage();
    }

    // Open modal via deep link
    const caseHash = window.location.hash.match(/case=([\w-]+)/);
    if (caseHash) openModal(caseHash[1]);

    // Init chat widget
    initChatWidget();

    // Apply interface translations last (after all chrome is rendered).
    if (window.AICasesI18n) AICasesI18n.apply();
  } catch (err) {
    console.error("[initPage failed]", err);
    const grid = document.getElementById("cases-grid");
    if (grid) grid.innerHTML = `<div class="empty-state">❌ ${T("載入失敗")}：${escape(err.message)}<br><small>${T("請確認資料來源或稍後再試")}</small></div>`;
  }
}
