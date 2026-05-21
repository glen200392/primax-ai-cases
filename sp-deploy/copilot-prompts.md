# SP Copilot Prompts — Build AI Cases Portal Natively

> **Phase**: 0a-1 alternative path (SP Native via Copilot)
> **目的**：給 Glen 一組可直接貼進 SP Pages Copilot 的 prompt，讓 Copilot 生 5 個 SP-native page，等價 v2/ portal 的 80% UX。
> **替代**：iframe 嵌入路徑 (`iframe-snippet.html`)
> **Last updated**: 2026-05-21

---

## Background — SP Copilot 能力範圍

**Copilot 擅長：**
- 加 section (1 / 2 / 3 column layout)
- 加 web part with default config (Hero / Text / Image / List view / News / Quick Links / Call to Action)
- 寫初始 text 文案
- 整體 page narrative 框架

**Copilot 不擅長 / 不能做：**
- Configure web part 連到指定 SP List (要 Glen 手動點擊 web part → Edit → 選 list)
- 客製 web part layout 超過內建 templates 範圍
- 寫 custom JS / CSS / HTML
- 生 SPFx web parts
- live counter aggregation (e.g. "顯示 Deploy stage 案例數量")

**所以實際工作流：**
```
Step 1: 貼下方 prompt 給 Copilot → 生 page 骨架
Step 2: Copilot 退出 → Glen 進每個 web part 手動 configure (主要是 List View binding)
Step 3: Save / Publish
```

---

## Site-Level Pre-requisite (做 page 前先確認)

```
[ ] SP site = https://tymcloud.sharepoint.com/sites/DTO/
[ ] AICases_v2 SP List 已建立 (跑過 backend/deploy-sharepoint.ps1)
[ ] AICases_v2 List 已有 ≥ 1 個案例 (跑過 excel_to_splist.ps1 灌 baseline)
    或: 至少先手動建 3-5 個範例案例供 Page 設計時看效果
[ ] Glen 有 site Owner / Designer permission (editPage right)
[ ] SP global nav 預先建好 (Settings → Edit navigation → 加 5 link)
```

⚠️ **若 AICases_v2 還沒灌資料 → Copilot 生的 List View web part 會空白**。建議先跑 Phase 0b (`excel_to_splist.ps1` 灌 baseline) 再做 SP Copilot page。

---

## Page 1 of 5 — Home (集團 AI 應用案例專區)

對應原 v2/home.html。

### Copilot prompt

```
建立一個首頁，標題是「集團 AI 應用案例專區」，副標「Primax × AI Empowerment · 集團數位轉型成果展示」。

頁面分 4 個 section：

Section 1: Hero
使用 Hero web part 模板，主標「探索集團 AI 應用」副標「從 Prototype 到 Deploy，看見集團每個 AI 應用的價值故事」，加一個 CTA button「進入案例集」連到 cases page。

Section 2: PDD 漏斗概覽 (3 column)
三欄並排，每欄是一張 Call to Action card：
- 欄 1: Icon 用 🧪，標題「① Prototype」，描述「員工試做 / PoC 階段」，button text「查看 Prototype 案例」，button link 到 cases-prototype page
- 欄 2: Icon 用 ⚙，標題「② Development」，描述「IT 介入 / MVP 開發中」，button text「查看 Development 案例」，button link 到 cases-development page
- 欄 3: Icon 用 🚀，標題「③ Deploy」，描述「已上線 / 穩定運行」，button text「查看 Deploy 案例」，button link 到 cases-deploy page

Section 3: 最新案例
加一個 List view web part 連到 AICases_v2 list，filter Publish_Status = Active-Published，排序 Last_Updated descending，顯示前 6 筆，layout 用 Tiles，每張 tile 顯示 Title 跟 Benefits_Summary。

Section 4: 工具與資源
加一個 Quick Links web part，3 張 link card：
- 「🤖 AI Cases 對話查詢」（暫留 placeholder link）
- 「📝 提交我的 AI 案例」連到 Microsoft Forms 案例送件表單（link 之後補）
- 「📖 AI 應用指引」連到 Site Assets / 指引文件
```

### Manual configure (Copilot 後)

1. **Section 1 Hero**: 進 Hero web part → 換背景圖：上傳 `home_hero_top.png` 或從 SP Site Assets 選
2. **Section 2 PDD 漏斗**: Copilot 生的是 static text + button。若要 **live counter** (例如顯示「23 個 Prototype 案例」)，需手動加 Highlighted Content web part (查 `AICases_v2` filter Stage_Norm=Prototype，預覽 count) — 但 Highlighted Content 沒辦法直接顯示 count number，**只能列出案例 cards**。**真正 live count 需 SPFx 或 Power Apps embedded form**，本期接受 static
3. **Section 3 List view**:
   - 進 List view web part → Edit → "Select a list" → 選 `AICases_v2`
   - "Layout" → 選 Tiles (or Grid)
   - "Custom columns" → 顯示 Title / BG / Stage_Norm / Benefits_Summary 4 欄
   - "Filter" → `Publish_Status equals "Active-Published"`
   - "Sort" → `Last_Updated descending`
   - "Item limit" → 6
4. **Section 4 Quick Links**: 確認 3 張卡的 link 都對

### Expected SP-native vs v2/home.html diff

| v2/home.html 有 | SP page 有 | 差別 |
|---|---|---|
| Sidebar floating chat entry card (大型🤖) | Section 4 Quick Links (橫排) | 失 sidebar 動態感, 但仍有 chat entry placeholder |
| PDD 漏斗 live counters (6/0/7) | 3 column static text | 失 live count, 只剩 link |
| Hero 圖 home_hero_top.png | Hero web part (SP 原生) | 1:1 |
| 最新案例 random sample | List view Tiles top 6 by Last_Updated | 更佳：自動更新 |

---

## Page 2 of 5 — 案例集總覽 (cases)

對應原 v2/cases.html。

### Copilot prompt

```
建立一個案例集總覽頁，URL slug = cases，標題「集團 AI 應用案例集」，副標「依公司 / 單位 / 區域 / 階段瀏覽所有案例」。

第一個 section 用 Text web part 寫簡介：「以下展示所有 Primax 集團與 Tymphany 已通過 DTO 審核的 AI 應用案例。可依公司、單位、區域、階段篩選。點擊任一案例可查看完整 IPO + Before/After + Owner 故事。」

第二個 section 加 List view web part 連到 AICases_v2 list，layout 用 Tiles，filter Publish_Status 為 Active-Internal 或 Active-Published，顯示所有欄位含 Title / BG / Company / Unit / Region / Stage_Norm / Benefits_Summary。

在 List view 上方啟用 group by Stage_Norm，並允許員工從 column header 點 filter 篩選 Company / Unit / Region。
```

### Manual configure

1. **List view binding**: AICases_v2
2. **Layout**: Tiles (or Grid view if 想看 column 摘要)
3. **Custom card layout** (有限):
   - Title (big)
   - Company badge (color: PMX=blue, TYM=green)
   - Stage_Norm badge (color: Prototype=orange, Development=blue, Deploy=green)
   - Benefits_Summary (one line)
4. **Filter**: `Publish_Status in (Active-Internal, Active-Published)`
5. **Group**: by Stage_Norm
6. **Column filtering**: 在 List view → ⋯ → "Add column filter" 加 Company / Unit / Region
7. **Item detail page**: 員工點 tile 後預設開「View item」side pane (SP 內建 form)，自動 render 41 欄位
   - 想客製 4-column IPO display? → 進 List Settings → Form settings → Edit form layout → 切到 Power Apps form editor 設計 4 column custom layout (中等學曲線)

### Expected SP-native vs v2/cases.html diff

| v2/cases.html 有 | SP page 有 | 差別 |
|---|---|---|
| Card grid 客製 layout (BG/title/stage badge/benefit) | List view Tiles 模板 | 視覺略不同, 功能等價 |
| Filter chips top bar (Company/Unit/Region cascade) | List view column header filter | UX 不同, 功能等價 |
| 點 card → Modal 4 欄 IPO | 點 tile → side pane form (linear scroll) | **失 4 column layout**，變 form |
| Modal Before/After 對比 | side pane Before/After 上下列 | 失視覺對比 |
| Owner card with photo | side pane Owner_* 欄並列 | 失 card 包裝 |
| Quote testimonial highlight | side pane Quote 欄 inline | 失 highlight |
| Build_Story narrative | side pane Build_Story Multi-line | 失敘事感 |

⚠️ **若想保留 Modal 4 column layout**：兩條路:
- (a) **Power Apps form customization**: SP List → List settings → Form → "Customize forms with Power Apps" → 設計 4 column custom form (1-2 天工)
- (b) **Hybrid**: 此 Page 用 SP native list view, 但在 cases-deploy / cases-prototype 等子頁嵌一段 iframe to v2/ 對應段 (拿 4 column layout)

---

## Page 3-5 — cases-prototype / cases-development / cases-deploy

對應原 v2/cases-prototype.html / cases-development.html / cases-deploy.html。

3 個 page 共用 template，差別只在 Stage_Norm filter 值。

### Copilot prompt (Prototype, 其他兩個只換 Stage 名稱)

```
建立一個案例子頁，URL slug = cases-prototype，標題「① Prototype · 員工試做案例」。

Section 1: Text web part
簡介：「這頁列出處於 Prototype 階段的案例 — 員工個人試做、PoC、評估階段。這些案例還在探索期，多為個人主導或單一部門小範圍試驗。」

Section 2: List view web part
連到 AICases_v2 list，filter:
  - Stage_Norm = Prototype
  - Publish_Status = Active-Published (or Active-Internal, 看 Glen 想對外展多寬)
Layout: Tiles
Sort: Last_Updated descending
顯示欄位: Title / BG / Tools / Benefits_Summary

Section 3: Quick Links
3 張卡:
  - 連回首頁 (home)
  - 切到 Development 子頁 (cases-development)
  - 切到 Deploy 子頁 (cases-deploy)
```

對 Development，換成：
- URL slug = cases-development
- 標題「② Development · IT 接管中案例」
- 簡介「處於 IT 介入 / MVP / 持續開發階段的案例。已從個人試做進入正式專案管理。」
- Filter Stage_Norm = Development

對 Deploy，換成：
- URL slug = cases-deploy
- 標題「③ Deploy · 已上線案例」
- 簡介「已上線穩定運行的案例。產出實際業務價值。」
- Filter Stage_Norm = Deploy

### Manual configure (重複 3 次)

每 page List view 配置同 Page 2 邏輯，差別 filter 條件。

### Expected diff vs v2/

| v2/ 子頁有 | SP 子頁有 | 差別 |
|---|---|---|
| Sidebar funnel (3 stage 切換) | Section 3 Quick Links | 失 sidebar funnel 視覺, 仍可切換 |
| Card grid | List view Tiles | 1:1 等價 |
| Stage badge color | Tile column display | 等價 |

---

## Site Navigation Setup (1 次性，5 個 page 建完後做)

進 SP site → Settings → Edit Navigation → 加 5 個 link：

```
- 首頁 (home)
- 案例集 (cases)
- ① Prototype (cases-prototype)
- ② Development (cases-development)
- ③ Deploy (cases-deploy)
```

順序排好後 Save。員工從任一 page 都能用 top nav 切換。

---

## 缺口清單 (SP native 不能做、要補的)

| 失去的 v2/ UX | 補救選項 |
|---|---|
| PDD 漏斗 live counter (Prototype 23 / Development 5 / Deploy 7) | (a) SPFx web part 客製 (3-4 週)；(b) Power Apps embedded form (1-2 週)；(c) 接受 static link (本期) |
| Modal IPO 4 column 對比 | (a) Power Apps form customization (1-2 天)；(b) Hybrid 在子頁嵌單一 iframe to v2/ modal section (5 hr) |
| Owner card with photo + Quote highlight | (a) Power Apps form 客製 owner section；(b) List item display template 改 (限制大) |
| Sidebar chat keyword search | (a) Phase 2 加 Microsoft Copilot agent embedded；(b) Highlighted Content web part 模糊查 |
| Before/After 上下對比視覺 | Power Apps form 4-column section (Before 左 / After 右) |
| Build Story narrative section | Power Apps form 加大字 Multi-line section |

**短期建議**：先按本 prompts 做 5 page 出 MVP，缺口接受。後續 Phase 2 評估 Power Apps form customization (一勞永逸保留 80% v2/ UX，且仍 SP native)。

---

## 對照建議：兩條路怎麼選

| 維度 | Path A iframe (sp-deploy/) | Path B SP Copilot Native (本檔) |
|---|---|---|
| **保留 v2/ UX** | 100% | ~70% (失 funnel counter / modal / chat / Owner card) |
| **IT 相容性** | iframe 內 SP-internal origin work, 但 nav overlap risk | 100% native, 0 兼容問題 |
| **Live SP data** | 需 Phase 0a-3 寫 SP REST adapter | 0 work, List View web part 直連 SP List |
| **Maintain cost** | 維護 v2/ + cases.json + iframe sync | 維護 SP page (低) + Power Apps form (中) |
| **Mobile** | iframe 可能爆版 | SP page 原生 responsive |
| **Search** | 沒整合 SP global search | SP global search 自動 index 所有案例 |
| **Permission** | 跟 SP page 同 | 跟 SP page 同 |
| **Build time** | 已完成 (sp-deploy/ ready) | ~1 天 (Copilot 生 5 page + manual config) |

**我的建議**（不一定對，Glen 決）：

如果 **PDD 漏斗 + Modal IPO 4 欄 + Owner card 是核心識別** → 走 Path A iframe 路徑 (sp-deploy/ 已 ready)。

如果 **IT 友善 + 0 維護 + 永久 SP-native 是優先** → 走 Path B Copilot 路徑（接受 UX 退化 30%）。

最務實 → 都試一遍：
1. Path A 已 ready, Glen 拖 sp-deploy/ 上 SP + iframe 嵌入 看一遍 (30 min)
2. Path B 跑本檔 5 個 prompt 建 5 個 native page 看一遍 (1 hr)
3. 比對兩條路實際效果, 選一條或 Hybrid

---

## Quick start

```
1. 開 https://tymcloud.sharepoint.com/sites/DTO/SitePages/
2. + New → Site Page → Blank layout
3. Page name: AI-Cases-Copilot-Test
4. 點 page 內 + icon → 找 Copilot icon
5. 貼 Page 1 prompt → 等 Copilot 生
6. 進每個 web part 手動 configure (List View binding 等)
7. Save as draft (不發佈, test only)
8. 重複 Page 2-5
```

---

## Out of scope (本檔不涵蓋)

- Microsoft Forms 案例送件表 (Phase 2)
- Power Automate flow (Phase 2)
- AICases_v2 List 建立 (Phase 0b backend)
- baseline 98 cases 灌入 (Phase 0b)
- SP Comments / Likes 啟用 (Phase 2)
- Power Apps form customization 詳細步驟 (留下次)
- SPFx web part 開發 (Phase C if needed)
