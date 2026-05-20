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
const state = { company: "ALL", unit: "ALL", region: "ALL", search: "" };

/* ---------- utility ---------- */
function escape(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
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
  const resp = await fetch("../cases.json", { cache: "no-store" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const payload = await resp.json();
  META = payload;
  ALL_CASES = payload.cases || [];
}

/* ---------- meta + preview banner ---------- */
function updateMetaBar() {
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText("meta-updated", `更新日期：${META.generated_at ? META.generated_at.slice(0,10) : "—"}`);
  const previewBanner = document.getElementById("preview-banner");
  if (previewBanner && META.mode && META.mode !== "published") {
    previewBanner.style.display = "inline-block";
    previewBanner.textContent = `⚠️ ${META.mode === "internal" ? "Internal Preview" : "Admin Full View"} — ${META.exported}/${META.total_in_ssot} 案 (含未公開草稿)`;
  }
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
      v === "ALL" ? "全部" : v, count, state.company === v, () => {
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
      v === "ALL" ? "全部" : v, count, state.unit === v, () => {
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
      v === "ALL" ? "全部" : v, count, state.region === v, () => {
        state.region = v;
        renderFilters(); renderCasesGrid();
      }
    ));
  });
}

function matchesFilter(c) {
  if (CURRENT_STAGE && stageOf(c) !== CURRENT_STAGE) return false;
  if (state.company !== "ALL" && c.company !== state.company) return false;
  if (state.unit !== "ALL" && c.unit !== state.unit) return false;
  if (state.region !== "ALL" && c.region !== state.region) return false;
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
    const label = CURRENT_STAGE ? `${CURRENT_STAGE} 案例` : "案例總數";
    metaCount.textContent = `${label}：${visible.length} / ${poolForFilters().length}`;
  }
  if (visible.length === 0) {
    const summary = META && META.pipeline_summary;
    const totals = summary ? summary.funnel_counts : null;
    const allInStage = CURRENT_STAGE && totals ? (totals[CURRENT_STAGE] || 0) : 0;
    const pendingNote = CURRENT_STAGE === "Prototype" && summary
      ? `（${summary.pending_it_review} 案在 IT review queue 等接管）` : "";
    grid.innerHTML = CURRENT_STAGE
      ? `<div class="stage-empty">此階段目前 <strong>0</strong> 案已上架；全集團共 <strong>${allInStage}</strong> 案在此階段${pendingNote}</div>`
      : `<div class="empty-state">沒有符合條件的案例</div>`;
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
  `;
  setText("modal-title", c.title || "");
  setText("modal-tools", c.tools || "");
  setText("modal-id", (c.id || "—").toUpperCase());
  setText("modal-src", c.source_meeting || "—");
  setText("modal-updated", c.last_updated || "—");

  const body = document.getElementById("modal-body");
  const parts = [];

  if (c.pain_point) parts.push(renderSection("①", "痛點與情境", `<p>${escape(c.pain_point)}</p>`));

  if (c.before_how || c.after_how) {
    parts.push(`
      <section class="ba-section">
        <h4 class="ba-section__title">Before / After 對比</h4>
        <div class="ba-grid">
          <div class="ba-col ba-col--before">
            <div class="ba-col__label">Before · 導入前</div>
            ${c.before_how ? `<div class="ba-col__how">${escape(c.before_how)}</div>` : ""}
            ${c.before_pain ? `<div class="ba-col__pain"><strong>痛點：</strong>${escape(c.before_pain)}</div>` : ""}
          </div>
          <div class="ba-col ba-col--after">
            <div class="ba-col__label">After · 導入後</div>
            ${c.after_how ? `<div class="ba-col__how">${escape(c.after_how)}</div>` : ""}
            ${c.after_outcome ? `<div class="ba-col__outcome"><strong>結果：</strong>${escape(c.after_outcome)}</div>` : ""}
          </div>
        </div>
      </section>`);
  }

  // IPO + Benefits 4-col horizontal grid
  const hasIPO = (c.input && c.input.length) || (c.process && c.process.length)
              || (c.output && c.output.length) || (c.benefits && c.benefits.length);
  if (hasIPO) {
    const col = (variant, label, items) => {
      const inner = items && items.length ? renderList(items) : '<div class="ipo-col__empty">—</div>';
      return `<div class="ipo-col ipo-col--${variant}"><div class="ipo-col__head">${label}</div><div class="ipo-col__body">${inner}</div></div>`;
    };
    parts.push(`
      <div class="ipo-grid">
        ${col("input", "INPUT · 輸入", c.input)}
        ${col("process", "PROCESS · 流程處理", c.process)}
        ${col("output", "OUTPUT · 產出", c.output)}
        ${col("benefits", "效益評估", c.benefits)}
      </div>`);
  }

  if (c.build_story) {
    parts.push(`
      <div class="build-story">
        <div class="build-story__label">⚙ 怎麼做出來的</div>
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

  if (c.quote) parts.push(`<div class="quote-block">${escape(c.quote)}</div>`);

  body.innerHTML = parts.join("");

  // Interaction bar
  document.getElementById("ix-like-count").textContent = getLikes(id).count;
  document.getElementById("ix-like").classList.toggle("is-active", getLikes(id).liked);
  refreshCommentsUI();
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
function refreshCommentsUI() {
  if (!currentCaseId) return;
  const list = getComments(currentCaseId);
  const cntEl = document.getElementById("ix-comments-count");
  if (cntEl) cntEl.textContent = list.length;
  const wrap = document.getElementById("comments-list");
  if (!wrap) return;
  if (list.length === 0) {
    wrap.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px;font-style:italic">還沒有評論，第一個留言吧</div>';
    return;
  }
  wrap.innerHTML = list.slice().reverse().map(c => `
    <div style="padding:12px 14px;background:var(--bg-section-alt);border-radius:8px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="font-weight:700;color:var(--text-primary)">${escape(c.name)}</span>
        <span style="color:var(--text-muted)">${new Date(c.time).toLocaleString("zh-TW", { hour12: false })}</span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">${escape(c.text)}</div>
    </div>
  `).join("");
}

function wireModalEvents() {
  closeBtn().onclick = closeModal;
  backdrop().onclick = e => { if (e.target === backdrop()) closeModal(); };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && backdrop().classList.contains("is-open")) closeModal();
  });
  document.getElementById("ix-like").addEventListener("click", () => {
    if (!currentCaseId) return;
    toggleLike(currentCaseId);
    const v = getLikes(currentCaseId);
    document.getElementById("ix-like-count").textContent = v.count;
    document.getElementById("ix-like").classList.toggle("is-active", v.liked);
  });
  document.getElementById("ix-share").addEventListener("click", async () => {
    if (!currentCaseId) return;
    const url = `${window.location.origin}${window.location.pathname}#case=${currentCaseId}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Primax AI Case", url }); showToast("已開啟分享面板"); }
      else { await navigator.clipboard.writeText(url); showToast("✓ 連結已複製"); }
    } catch (err) { showToast("分享失敗：" + err.message); }
  });
  document.getElementById("ix-comments-toggle").addEventListener("click", () => {
    document.getElementById("comments-section").classList.toggle("is-open");
  });
  const form = document.getElementById("comment-form");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    if (!currentCaseId) return;
    const name = document.getElementById("comment-name").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    if (!name || !text) return;
    addComment(currentCaseId, name, text);
    document.getElementById("comment-text").value = "";
    localStorage.setItem("pmx-ai-cases:lastname", name);
    refreshCommentsUI();
    showToast("✓ 留言已送出");
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
    appendChatMsg(`找不到「<strong>${escape(q)}</strong>」相關的案例，試試其他關鍵字（例如工具名 / BG / Owner 姓名）。`, "bot");
    return;
  }
  let html = `<div class="chat-msg__header">🔍 找到 ${hits.length} 個相關案例</div>`;
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
        <a class="chat-result__link" href="${page}#case=${escape(c.id)}">查看 →</a>
      </div>`;
  });
  appendChatMsg(html, "bot");
}
function initChatWidget() {
  const entry = document.getElementById("chat-fab");  // entry card in sidebar (id kept for back-compat)
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  if (!entry || !panel) return;

  entry.addEventListener("click", () => {
    panel.classList.add("is-open");
    entry.classList.add("is-active");
    setTimeout(() => input && input.focus(), 50);
  });
  closeBtn.addEventListener("click", () => {
    panel.classList.remove("is-open");
    entry.classList.remove("is-active");
  });

  // Initial greeting
  appendChatMsg(`你好 👋 我可以幫你找案例。試試搜尋工具名（如 <strong>Power Automate</strong>）、Owner 姓名、BG（如 <strong>HR</strong>）或關鍵字（如 <strong>對帳</strong>）。`, "bot");

  const submit = () => {
    const q = input.value;
    input.value = "";
    handleChatQuery(q);
  };
  sendBtn.addEventListener("click", submit);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  });
}

/* ---------- public entry: initPage ---------- */
async function initPage(stageOrNull) {
  CURRENT_STAGE = stageOrNull;
  try {
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
  } catch (err) {
    console.error("[initPage failed]", err);
    const grid = document.getElementById("cases-grid");
    if (grid) grid.innerHTML = `<div class="empty-state">❌ 載入失敗：${escape(err.message)}<br><small>請確認 cases.json 存在</small></div>`;
  }
}
