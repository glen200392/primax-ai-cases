/* =========================================================================
   Primax AI Cases — interface i18n (Phase 1)

   Strategy: 繁中 (zh-Hant) is the SOURCE language (the HTML/CMS text). For any
   other language we override a curated set of UI elements by looking up the
   element's current 繁中 text in a dictionary. This avoids editing every label
   in the HTML and never touches case *data* (only chrome strings match keys).

   Languages: zh-Hant (source) · zh-Hans · en
   ========================================================================= */
window.AICasesI18n = (function () {
  const SOURCE = "zh-Hant";
  const LANGS = [
    { code: "zh-Hant", label: "繁中" },
    { code: "zh-Hans", label: "简中" },
    { code: "en", label: "EN" }
  ];

  // 繁中 source string -> { zh-Hans, en }
  const DICT = {
    // header
    "AI × 流程自動化案例集": { "zh-Hans": "AI × 流程自动化案例集", "en": "AI × Process Automation Cases" },
    "從日常痛點出發，找到可複製的效率解法": { "zh-Hans": "从日常痛点出发，找到可复制的效率解法", "en": "Start from daily pain points; find repeatable efficiency solutions" },
    "案例集治理機制": { "zh-Hans": "案例集治理机制", "en": "Case Governance" },
    "透過各 BG/Fun 數位大使與 DX Office 審核，於公司內網分享實踐案例。": { "zh-Hans": "透过各 BG/Fun 数字大使与 DX Office 审核，于公司内网分享实践案例。", "en": "Reviewed by BG/Fun digital ambassadors and the DX Office, shared on the corporate intranet." },
    // nav
    "📍 首頁": { "zh-Hans": "📍 首页", "en": "📍 Home" },
    "📚 案例集": { "zh-Hans": "📚 案例集", "en": "📚 Cases" },
    "⚙ 管理": { "zh-Hans": "⚙ 管理", "en": "⚙ Admin" },
    // sub-nav
    "📊 案例集首頁": { "zh-Hans": "📊 案例集首页", "en": "📊 Overview" },
    // section titles
    "🆕 最近更新 Top 3": { "zh-Hans": "🆕 最近更新 Top 3", "en": "🆕 Recently Updated Top 3" },
    "📂 三階段案例入口": { "zh-Hans": "📂 三阶段案例入口", "en": "📂 Three-Stage Entry" },
    "點階段卡看該階段全部案例": { "zh-Hans": "点阶段卡看该阶段全部案例", "en": "Click a stage card to see all its cases" },
    // stage entries
    "員工試做": { "zh-Hans": "员工试做", "en": "Employee Trial" },
    "User 主導 · AI 助攻 · 未過資安線": { "zh-Hans": "User 主导 · AI 助攻 · 未过资安线", "en": "User-led · AI-assisted · pre-security-gate" },
    "IT 接管中": { "zh-Hans": "IT 接管中", "en": "IT Taking Over" },
    "User × IT 協作 · 後端整合": { "zh-Hans": "User × IT 协作 · 后端整合", "en": "User × IT · backend integration" },
    "已上線": { "zh-Hans": "已上线", "en": "Live" },
    "IT 主導 · 過資安線 · 全線管控": { "zh-Hans": "IT 主导 · 过资安线 · 全线管控", "en": "IT-led · security-passed · fully managed" },
    "進入案例": { "zh-Hans": "进入案例", "en": "Enter →" },
    // search widget
    "🤖 AI 助手 · 快速找案例": { "zh-Hans": "🤖 AI 助手 · 快速找案例", "en": "🤖 AI Assistant · Find Cases" },
    "工具 / BG / Owner / 關鍵字 ...": { "zh-Hans": "工具 / BG / Owner / 关键字 ...", "en": "Tool / BG / Owner / keyword ..." },
    "輸入後按 Enter，結果以懸浮畫面顯示": { "zh-Hans": "输入后按 Enter，结果以悬浮画面显示", "en": "Press Enter; results appear in a popup" },
    // governance sidebar
    "🛡 AI 使用三守則": { "zh-Hans": "🛡 AI 使用三守则", "en": "🛡 Three AI Rules" },
    "機密不出網 — 走內網 Azure OpenAI": { "zh-Hans": "机密不出网 — 走内网 Azure OpenAI", "en": "Keep secrets internal — use intranet Azure OpenAI" },
    "看案例 ≠ 自用授權 — 先確認白名單": { "zh-Hans": "看案例 ≠ 自用授权 — 先确认白名单", "en": "Viewing ≠ permission to use — check the allowlist first" },
    "有疑問問 DTO — 不確定先問再動": { "zh-Hans": "有疑问问 DTO — 不确定先问再动", "en": "Ask DTO if unsure — ask before acting" },
    "⚠ 資安治理 Gate": { "zh-Hans": "⚠ 资安治理 Gate", "en": "⚠ Security Gate" },
    "Prototype → Deploy 必經閘門": { "zh-Hans": "Prototype → Deploy 必经闸门", "en": "Mandatory gate: Prototype → Deploy" },
    "帳號管控（誰能用、用哪些資料）": { "zh-Hans": "账号管控（谁能用、用哪些资料）", "en": "Access control (who, which data)" },
    "資料分級 + DLP 外洩防護": { "zh-Hans": "资料分级 + DLP 外泄防护", "en": "Data classification + DLP" },
    "後端整合公司 IT 平台": { "zh-Hans": "后端整合公司 IT 平台", "en": "Backend integrated with corporate IT" },
    "稽核軌跡完整可追溯": { "zh-Hans": "稽核轨迹完整可追溯", "en": "Complete, traceable audit trail" },
    "🧰 公司開放 AI 工具": { "zh-Hans": "🧰 公司开放 AI 工具", "en": "🧰 Approved AI Tools" },
    "外部 AI 一律不可": { "zh-Hans": "外部 AI 一律不可", "en": "No external AI" },
    "其他公開服務（ChatGPT / Claude / Gemini 等）一律不得處理公司資料": { "zh-Hans": "其他公开服务（ChatGPT / Claude / Gemini 等）一律不得处理公司资料", "en": "Other public services (ChatGPT / Claude / Gemini, etc.) must not process company data" },
    // home funnel
    "如何實踐 AI 與自動化場景": { "zh-Hans": "如何实践 AI 与自动化场景", "en": "How to realize AI & automation" },
    "AI 落地分三階段，每階段 User 與 IT 的分工不同。點下方數字即可看對應階段案例。": { "zh-Hans": "AI 落地分三阶段，每阶段 User 与 IT 的分工不同。点下方数字即可看对应阶段案例。", "en": "AI adoption has three stages with different User/IT roles. Click a number to see that stage's cases." },
    "員工試做 · User 主導": { "zh-Hans": "员工试做 · User 主导", "en": "Employee trial · User-led" },
    "IT 接管中 · User × IT": { "zh-Hans": "IT 接管中 · User × IT", "en": "IT taking over · User × IT" },
    "已上線 · IT 主導": { "zh-Hans": "已上线 · IT 主导", "en": "Live · IT-led" },
    "看案例": { "zh-Hans": "看案例", "en": "View" },
    "五個步驟，從共識開始，讓數據與 AI 驅動營運。每一步都需要 DTO / IT 陪跑。": { "zh-Hans": "五个步骤，从共识开始，让数据与 AI 驱动营运。每一步都需要 DTO / IT 陪跑。", "en": "Five steps, starting from consensus, letting data and AI drive operations. Each step needs DTO / IT alongside." },
    // comment form
    "你的姓名": { "zh-Hans": "你的姓名", "en": "Your name" },
    "留下你的想法...": { "zh-Hans": "留下你的想法...", "en": "Share your thoughts..." },
    "送出留言": { "zh-Hans": "送出留言", "en": "Submit" },
    // meta + misc chrome
    "👤 維護：DTO Office": { "zh-Hans": "👤 维护：DTO Office", "en": "👤 Maintained by DTO Office" },
    "依 last_updated 排序": { "zh-Hans": "依 last_updated 排序", "en": "Sorted by last_updated" },
    "案例總數": { "zh-Hans": "案例总数", "en": "Total cases" },
    "更新日期": { "zh-Hans": "更新日期", "en": "Updated" },
    "案例": { "zh-Hans": "案例", "en": "cases" },
    "沒有案例": { "zh-Hans": "没有案例", "en": "No cases" },
    "沒有符合條件的案例": { "zh-Hans": "没有符合条件的案例", "en": "No matching cases" },
    // interaction bar
    "讚": { "zh-Hans": "赞", "en": "Like" },
    "分享連結": { "zh-Hans": "分享链接", "en": "Share" },
    "評論": { "zh-Hans": "评论", "en": "Comments" },
    "還沒有評論，第一個留言吧": { "zh-Hans": "还没有评论，第一个留言吧", "en": "No comments yet — be the first" },
    // modal body (case detail)
    "痛點與情境": { "zh-Hans": "痛点与情境", "en": "Pain Point & Context" },
    "Before / After 對比": { "zh-Hans": "Before / After 对比", "en": "Before / After" },
    "Before · 導入前": { "zh-Hans": "Before · 导入前", "en": "Before" },
    "After · 導入後": { "zh-Hans": "After · 导入后", "en": "After" },
    "痛點：": { "zh-Hans": "痛点：", "en": "Pain: " },
    "結果：": { "zh-Hans": "结果：", "en": "Result: " },
    "INPUT · 輸入": { "zh-Hans": "INPUT · 输入", "en": "INPUT" },
    "PROCESS · 流程處理": { "zh-Hans": "PROCESS · 流程处理", "en": "PROCESS" },
    "OUTPUT · 產出": { "zh-Hans": "OUTPUT · 产出", "en": "OUTPUT" },
    "效益評估": { "zh-Hans": "效益评估", "en": "Benefits" },
    "⚙ 怎麼做出來的": { "zh-Hans": "⚙ 怎么做出来的", "en": "⚙ How it was built" },
    // chat search panel
    "🔍 搜尋結果": { "zh-Hans": "🔍 搜索结果", "en": "🔍 Search Results" },
    "找到": { "zh-Hans": "找到", "en": "Found" },
    "個相關案例": { "zh-Hans": "个相关案例", "en": "related cases" },
    "查看 →": { "zh-Hans": "查看 →", "en": "View →" },
    "找不到符合的案例，換個關鍵字試試（例如工具 / BG / Owner）": { "zh-Hans": "找不到符合的案例，换个关键字试试（例如工具 / BG / Owner）", "en": "No matching cases — try another keyword (e.g. tool / BG / Owner)" },
    // toasts
    "✓ 連結已複製": { "zh-Hans": "✓ 链接已复制", "en": "✓ Link copied" },
    "已開啟分享面板": { "zh-Hans": "已开启分享面板", "en": "Share panel opened" },
    "✓ 留言已送出": { "zh-Hans": "✓ 留言已送出", "en": "✓ Comment posted" },
    // classification tags + filters (two-tier taxonomy 2026-06-10)
    "自動化": { "zh-Hans": "自动化", "en": "Automation" },
    "AI 應用": { "zh-Hans": "AI 应用", "en": "AI" },
    "混合": { "zh-Hans": "混合", "en": "Hybrid" },
    "全部": { "zh-Hans": "全部", "en": "All" },
    "類型": { "zh-Hans": "类型", "en": "Type" },
    "場景": { "zh-Hans": "场景", "en": "Scenario" },
    "導入": { "zh-Hans": "导入", "en": "Adopt" },
    "負責人心得": { "zh-Hans": "负责人心得", "en": "Owner's Note" },
    // tier-2 scenario tags
    "對帳與查核": { "zh-Hans": "对账与查核", "en": "Reconciliation & Audit" },
    "異常偵測與預警": { "zh-Hans": "异常侦测与预警", "en": "Anomaly Detection & Alerts" },
    "報價與詢價": { "zh-Hans": "报价与询价", "en": "Quotation & RFQ" },
    "文件辨識與處理": { "zh-Hans": "文件识别与处理", "en": "Document AI & Processing" },
    "品質與視覺檢測": { "zh-Hans": "质量与视觉检测", "en": "Quality & Visual Inspection" },
    "知識問答與檢索": { "zh-Hans": "知识问答与检索", "en": "Knowledge Q&A & Search" },
    "流程簽核與BPM": { "zh-Hans": "流程签核与BPM", "en": "Approval & BPM" },
    "工程計算與模擬": { "zh-Hans": "工程计算与仿真", "en": "Engineering Calc & Simulation" },
    "製造與生產管理": { "zh-Hans": "制造与生产管理", "en": "Manufacturing & Production" },
    "市場與客戶分析": { "zh-Hans": "市场与客户分析", "en": "Market & Customer Analytics" },
    "報表與數據統計": { "zh-Hans": "报表与数据统计", "en": "Reporting & Data Stats" },
    "資料整合與清洗": { "zh-Hans": "数据整合与清洗", "en": "Data Integration & Cleansing" },
    "會議與溝通": { "zh-Hans": "会议与沟通", "en": "Meetings & Communication" },
    "招募與訓練": { "zh-Hans": "招募与训练", "en": "Recruiting & Training" },
    "表單與申請流程": { "zh-Hans": "表单与申请流程", "en": "Forms & Request Flows" },
    "行政庶務": { "zh-Hans": "行政庶务", "en": "Admin Tasks" },
    "平台與工具建置": { "zh-Hans": "平台与工具建设", "en": "Platforms & Tools" },
    "治理與基礎建設": { "zh-Hans": "治理与基础建设", "en": "Governance & Infra" },
    // derived module tags
    "RPA 流程": { "zh-Hans": "RPA 流程", "en": "RPA Flow" },
    "排程任務": { "zh-Hans": "排程任务", "en": "Scheduled Jobs" },
    "Excel 自動化": { "zh-Hans": "Excel 自动化", "en": "Excel Automation" },
    "RAG 知識庫": { "zh-Hans": "RAG 知识库", "en": "RAG Knowledge Base" },
    "LLM 應用": { "zh-Hans": "LLM 应用", "en": "LLM App" },
    "電腦視覺": { "zh-Hans": "计算机视觉", "en": "Computer Vision" },
    "BPM 整合": { "zh-Hans": "BPM 整合", "en": "BPM Integration" },
    "BI 報表": { "zh-Hans": "BI 报表", "en": "BI Reports" },
    "Python 腳本": { "zh-Hans": "Python 脚本", "en": "Python Scripts" },
    // ECRS improvement classification — full names (chip shows "字母·全名", e.g. E·刪除 / E·Eliminate)
    "刪除": { "zh-Hans": "删除", "en": "Eliminate" },
    "合併": { "zh-Hans": "合并", "en": "Combine" },
    "重排": { "zh-Hans": "重排", "en": "Rearrange" },
    "簡化": { "zh-Hans": "简化", "en": "Simplify" },
    // residual chrome strings embedded in dynamic content (caught by text-node walker)
    "公司：": { "zh-Hans": "公司：", "en": "Company: " },
    "單位：": { "zh-Hans": "单位：", "en": "Unit: " },
    "區域：": { "zh-Hans": "区域：", "en": "Region: " },
    "搜尋案例 / 工具 / 效益 / Owner...": { "zh-Hans": "搜索案例 / 工具 / 效益 / Owner...", "en": "Search cases / tools / benefits / owner..." },
    "案例編號：": { "zh-Hans": "案例编号：", "en": "Case ID: " },
    "· 來源：": { "zh-Hans": "· 来源：", "en": "· Source: " },
    "最後更新：": { "zh-Hans": "最后更新：", "en": "Last updated: " },
    "已上架 / 全集團": { "zh-Hans": "已上架 / 全集团", "en": "Live / Group" },
    "維護：DTO Office · 數字來源：": { "zh-Hans": "维护：DTO Office · 数字来源：", "en": "Maintained by DTO Office · Source: " },
    "案例集": { "zh-Hans": "案例集", "en": "Cases" },
    // stage subpages (prototype / development / deploy) — page-specific header text
    "① Prototype · 員工試做案例": { "zh-Hans": "① Prototype · 员工试做案例", "en": "① Prototype · Employee Trials" },
    "① Prototype · 員工試做": { "zh-Hans": "① Prototype · 员工试做", "en": "① Prototype · Employee Trial" },
    "User 主導 · AI 助攻 · 尚未過資安線。看看別人已經試出什麼，找到自己能學的場景。": { "zh-Hans": "User 主导 · AI 助攻 · 尚未过资安线。看看别人已经试出什么，找到自己能学的场景。", "en": "User-led · AI-assisted · pre-security-gate. See what others have piloted and find scenarios you can learn from." },
    "⚙ Prototype 案例：—": { "zh-Hans": "⚙ Prototype 案例：—", "en": "⚙ Prototype cases: —" },
    "② Development · IT 接管中案例": { "zh-Hans": "② Development · IT 接管中案例", "en": "② Development · IT Taking Over" },
    "② Development · 系統工程化": { "zh-Hans": "② Development · 系统工程化", "en": "② Development · Engineering" },
    "User × IT 協作 · 帳號 / 後端 / 資安整合中。看哪些案進入工程化階段。": { "zh-Hans": "User × IT 协作 · 账号 / 后端 / 资安整合中。看哪些案进入工程化阶段。", "en": "User × IT · accounts / backend / security integration. See which cases are entering engineering." },
    "⚙ Development 案例：—": { "zh-Hans": "⚙ Development 案例：—", "en": "⚙ Development cases: —" },
    "③ Deploy · 已上線案例": { "zh-Hans": "③ Deploy · 已上线案例", "en": "③ Deploy · Live Cases" },
    "③ Deploy · 上線維運": { "zh-Hans": "③ Deploy · 上线维运", "en": "③ Deploy · Live & Maintained" },
    "IT 主導 · 過資安線 · 全線管控。集團已部署到生產環境、穩定運行的案例。": { "zh-Hans": "IT 主导 · 过资安线 · 全线管控。集团已部署到生产环境、稳定运行的案例。", "en": "IT-led · security-passed · fully managed. Cases deployed to production and running stably." },
    "⚙ Deploy 案例：—": { "zh-Hans": "⚙ Deploy 案例：—", "en": "⚙ Deploy cases: —" },
    "← 案例集首頁": { "zh-Hans": "← 案例集首页", "en": "← Overview" },
    "⚙ 案例總數：—": { "zh-Hans": "⚙ 案例总数：—", "en": "⚙ Total cases: —" },
    "📅 更新日期：—": { "zh-Hans": "📅 更新日期：—", "en": "📅 Updated: —" },
    // stage subpages — big section heading (① ② ③ are separate circles, not in the text node)
    "Prototype · 員工試做": { "zh-Hans": "Prototype · 员工试做", "en": "Prototype · Employee Trial" },
    "Development · 系統工程化": { "zh-Hans": "Development · 系统工程化", "en": "Development · Engineering" },
    "Deploy · 上線維運": { "zh-Hans": "Deploy · 上线维运", "en": "Deploy · Live & Maintained" },
    "User 主導 · AI 助攻 · 尚未過資安線": { "zh-Hans": "User 主导 · AI 助攻 · 尚未过资安线", "en": "User-led · AI-assisted · pre-security-gate" },
    "User × IT 協作 · 帳號 / 後端 / 資安整合中": { "zh-Hans": "User × IT 协作 · 账号 / 后端 / 资安整合中", "en": "User × IT · accounts / backend / security integration" },
    "IT 主導 · 過資安線 · 全線管控": { "zh-Hans": "IT 主导 · 过资安线 · 全线管控", "en": "IT-led · security-passed · fully managed" },
    // stage-empty message (JS-rendered with dynamic numbers, wrapped with T())
    "此階段目前": { "zh-Hans": "此阶段目前", "en": "This stage currently has" },
    "案已上架；全集團共": { "zh-Hans": "案已上架；全集团共", "en": "published; group total" },
    "案在此階段": { "zh-Hans": "案在此阶段", "en": "in this stage" },
    "案在 IT review queue 等接管": { "zh-Hans": "案在 IT review queue 等接管", "en": "in the IT review queue" },
    // JS-rendered toast / error messages (wrapped with T() in shared.js)
    "操作失敗": { "zh-Hans": "操作失败", "en": "Action failed" },
    "分享失敗": { "zh-Hans": "分享失败", "en": "Share failed" },
    "送出失敗": { "zh-Hans": "送出失败", "en": "Submit failed" },
    "載入失敗": { "zh-Hans": "加载失败", "en": "Load failed" },
    "請確認資料來源或稍後再試": { "zh-Hans": "请确认数据来源或稍后再试", "en": "Please check the data source or try again later" }
  };

  // Curated text targets (leaf elements, no nested dynamic content).
  const TEXT_SELECTORS = [
    ".page-header__title", ".page-header__subtitle",
    ".page-header__governance__desc",
    "a.page-nav__tab", "a.sub-nav__tab",
    ".section-title-row h2",
    ".stage-entry__title", ".stage-entry__sub", ".stage-entry__arrow",
    ".sidebar-card__label", ".sidebar-card__title-text", ".sidebar-card__list li", ".sidebar-card__meta",
    ".sidebar-search-hint",
    ".security-tag--no",
    ".funnel-card__title", ".funnel-card__sub",
    ".funnel-live__hint", ".funnel-live__cta",
    ".hero-img-wrap__caption",
    ".ix-btn span:not(.ix-btn__count)",  // like/share/comment labels (never the live count span)
    ".section-title-row .muted",
    ".page-header__meta span", // static "維護" span; dynamic count/updated set via t() won't match keys
    ".chat-panel__title",
    ".stage-section__title", ".stage-section__sub"  // stage subpages' big section heading (① is a separate circle)
  ];
  // Placeholder targets
  const PH_SELECTORS = ["#chat-input-inline", "#comment-name", "#comment-text", "#search-input"];
  // Containers whose text is case DATA (never translate via the dictionary walker).
  const SKIP_SEL = ".case-card, .modal__body, #cases-grid, #recent-grid, .comments-section, .chat-result, #chat-body, .stage-entry__count, .ix-btn__count, [data-no-i18n]";

  let current = SOURCE;
  const SUPPORTED = LANGS.map(l => l.code);

  // Map an OS/AD/browser locale (e.g. "zh-TW", "zh-CN", "en-US") to a supported code.
  function _mapLocale(loc) {
    if (!loc) return null;
    loc = String(loc).toLowerCase();
    if (loc.startsWith("zh")) {
      if (loc.includes("cn") || loc.includes("hans") || loc.includes("sg")) return "zh-Hans";
      return "zh-Hant"; // zh-TW / zh-HK / zh-Hant
    }
    if (loc.startsWith("en")) return "en";
    return null;
  }

  // Precedence: explicit user choice > ?lang > Entra/AD preferredLanguage > browser locale > source.
  function _lang() {
    const stored = localStorage.getItem("aicases:lang");
    if (stored && SUPPORTED.includes(stored)) return stored;
    const url = new URLSearchParams(location.search).get("lang");
    if (url && SUPPORTED.includes(url)) return url;
    const ad = _mapLocale(window.__USER_LANG);          // set from /api/me (AD preferredLanguage)
    if (ad) return ad;
    const nav = _mapLocale(navigator.language || (navigator.languages || [])[0]);
    if (nav) return nav;
    return SOURCE;
  }

  // Translate a JS-rendered string. Resolves language fresh each call so it is
  // correct regardless of whether apply() has run yet (render order independent).
  function t(src) {
    const lang = current !== SOURCE ? current : _lang();
    if (lang === SOURCE) return src;
    const e = DICT[src];
    return (e && e[lang]) || src;
  }

  function apply() {
    current = _lang();
    if (current === SOURCE) { _injectSwitcher(); return; }
    TEXT_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => {
      const src = el.getAttribute("data-i18n-src") || el.textContent.trim();
      if (!el.getAttribute("data-i18n-src")) el.setAttribute("data-i18n-src", src);
      const tr = DICT[src] && DICT[src][current];
      if (tr) el.textContent = tr;
    }));
    PH_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => {
      const src = el.getAttribute("data-i18n-ph") || el.getAttribute("placeholder") || "";
      if (!el.getAttribute("data-i18n-ph")) el.setAttribute("data-i18n-ph", src);
      const tr = DICT[src] && DICT[src][current];
      if (tr) el.setAttribute("placeholder", tr);
    }));
    // Generic [data-i18n] elements (text-only leaves).
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const src = el.getAttribute("data-i18n-src") || el.textContent.trim();
      if (!el.getAttribute("data-i18n-src")) el.setAttribute("data-i18n-src", src);
      const tr = DICT[src] && DICT[src][current];
      if (tr) el.textContent = tr;
    });
    // Governance card title: translate the trailing text node, keep the icon span.
    document.querySelectorAll(".page-header__governance__title").forEach(el => {
      el.childNodes.forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const src = n.__i18nSrc || n.textContent.trim(); n.__i18nSrc = src;
          const tr = DICT[src] && DICT[src][current];
          if (tr) n.textContent = tr;
        }
      });
    });
    // Catch-all: translate any dictionary-keyed text node outside case-DATA areas.
    _translateTextNodes(document.body);
    document.documentElement.setAttribute("lang", current);
    _injectSwitcher();
  }

  function _translateTextNodes(root) {
    if (!root || !window.NodeFilter || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const t = n.textContent.trim();
        if (!t || !(DICT[t] && DICT[t][current])) return NodeFilter.FILTER_REJECT;
        if (n.parentElement && n.parentElement.closest(SKIP_SEL)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      const src = node.textContent.trim();
      const tr = DICT[src] && DICT[src][current];
      if (tr) node.textContent = node.textContent.replace(src, tr);
    });
  }

  function set(lang) {
    localStorage.setItem("aicases:lang", lang);
    location.reload();
  }

  function _injectSwitcher() {
    document.querySelectorAll("nav.page-nav").forEach(nav => {
      if (nav.querySelector("[data-lang-switch]")) return;
      const sel = document.createElement("select");
      sel.setAttribute("data-lang-switch", "1");
      sel.className = "page-nav__tab";
      sel.style.cssText = "cursor:pointer;border:none;background:rgba(255,255,255,.15);color:#fff";
      LANGS.forEach(l => {
        const o = document.createElement("option");
        o.value = l.code; o.textContent = "🌐 " + l.label;
        o.style.color = "#1F2D33";
        if (l.code === current) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = () => set(sel.value);
      nav.appendChild(sel);
    });
  }

  return { apply, set, t, current: () => current, SOURCE, LANGS };
})();
