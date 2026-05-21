# Decisions Log

> Append-only。任何決策變更都要新增條目，不修改舊條目。

---

## 2026-05-19 — 5 Confirmed Scoping Decisions

回應 2026-05-19 手稿流程圖的 5 項提問。

### D-NEW-01: 可見範圍
- **Decision**: 全集團可見 (read)
- **Rationale**: 案例庫是集團 AI 賦能的展示窗口，所有員工都應該能看
- **Implication**: SP site permission = "Visitors" 給 Everyone except external users；List read permission inherit from site

### D-NEW-02: 寫入權限
- **Decision**: 只有 DTO team 能寫入 SP List
- **Rationale**: 集中品質控管，避免案例品質參差
- **Implication**:
  - SP List "Contribute" permission = DTO team only
  - 非 DTO 員工的送件走 Microsoft Forms → Power Automate flow（以 service account 身分）→ 寫入 List 為 `Status=Draft`
  - DTO team review 後 `Status=Published`
- **Open question**: "DTO team" 邊界？Glen + Vicky + 直屬？BG ambassador 算嗎？→ 影響 D-C4-4

### D-NEW-03: 訪談來源
- **Decision**: 不強制 Teams，任何來源都收
- **Rationale**: 訪談形式多元（電話 / 面對面 / 文件回收 / 自助送件）
- **Implication**:
  - Channel 1 訪談萃取 trigger 改成「SharePoint folder watch」(放錄音/文字檔)，不是 Teams transcript trigger
  - 支援來源：m4a / mp4 / docx / md / pdf / Teams transcript
  - 需要中間層做 transcription（若是錄音）→ 用 own-voice-get + Groq whisper-large-v3-turbo（已成熟）

### D-NEW-04: AI 萃取
- **Decision**: Azure OpenAI (內網部署 + 合規)
- **Rationale**: 部署在內網，跨境風險（PIPL）+ 資料外洩風險（Groq cloud）都要避開
- **Implication**:
  - Power Automate cloud flow 用 Azure OpenAI action（不用 OpenAI cloud / Groq / Claude API）
  - 需要 Azure OpenAI resource provisioning（IT 對齊 → 撞 `project_ms_ai_playbook` B2 Service Principal blocker）
  - 模型選擇：GPT-4.1 / o4-mini（後者便宜，但結構化萃取準度待 PoC 驗證）

### D-NEW-05: 互動功能
- **Decision**: 評論 + 按讚兩者都要
- **Rationale**: 鼓勵互動，分辨高價值案例
- **Implication**:
  - SP List 啟用 List Comments（List settings → Advanced settings → Allow comments）
  - 按讚 = SP List 內建 Like 功能（List settings → Rating settings → Likes，不是 Star ratings）
  - 詳情頁需顯示讚數 + 評論串

---

## 2026-05-19 — A5 Carry-over Decisions (deadline 2026-05-23)

從 `project_dto_use_case_form.md` (A5) 搬入，根據 5 confirmed scoping 重新評估建議方向。

### D-C4-1: 表單載體
- **Options**: SharePoint List form / SharePoint Form / Power Apps / Microsoft Forms
- **建議方向 (updated)**: **Microsoft Forms (前端) + Power Automate flow → SP List (後端)**
- **Why**:
  - D-NEW-02 限定只有 DTO 寫 List，非 DTO 員工不直接寫
  - Microsoft Forms 對員工最熟悉、UI 最佳、外部連結可分享
  - Flow 用 service account 寫入 List，繞過 D-NEW-02 限制
- **Status**: ⚠️ 待 Glen 拍板

### D-C4-2: 送件是否強制為上學習專區的前置
- **Options**: 強制 / 可選
- **建議方向 (updated)**: **強制送件 = 必要但非充分條件**
- **Why**: 送件後 → `Status=Draft`，DTO review → `Status=Published` 才上架。送件不等於上架，但上架前必須有送件記錄
- **Status**: ⚠️ 待 Glen 拍板

### D-C4-3: Benefits 量化規則
- **Options**: 自填 / 自填+證據選填 / 必須附證據
- **建議方向 (updated)**: **Draft 階段選填，Published 階段必填證據連結**
- **Why**: D-NEW-01 全集團可見 → 案例品質要更高 → Published 必附證據；但送件 friction 要低 → Draft 可缺
- **Implication**: SP List `EvidenceUrl` 欄位在 Status=Published 時為必填（用 List validation 或 Power Automate gate）
- **Status**: ⚠️ 待 Glen 拍板

### D-C4-4: 送件審核流程
- **Options**: Glen 一人 / BG ambassador → Glen 終審 / 不審
- **建議方向 (updated)**: **TBD — 需先確認 "DTO" 邊界（見 D-NEW-02 open question）**
- **Why**:
  - 若 BG ambassador 算 DTO 編制 → 走 ambassador 先審 → DTO terminal review
  - 若 BG ambassador 不算 DTO 編制 → 只能 Glen 一人審 → bottleneck risk
- **Status**: ⚠️ 待 Glen 拍板 + 邊界澄清

### D-C4-5: 既有 20+ 案例 metadata 補齊責任
- **Options**: Glen 一人灌 / 各 BG ambassador 認領
- **建議方向 (unchanged)**: **各 BG ambassador 認領 + Glen 示範 1-2 個**
- **Why**: 讓 A1 ambassador 真的有事做 + 分擔 workload
- **Status**: ⚠️ 待 Glen 拍板

---

## Action Items After Decisions Locked

- [ ] D-C4-1~5 拍板（deadline 2026-05-23）
- [ ] 修改 `backend/deploy-sharepoint.ps1` 反映 D-C4-3 EvidenceUrl validation
- [ ] 寫 `flows/extraction-flow.md` 反映 D-NEW-03 multi-source trigger
- [ ] 寫 `flows/azure-openai-prompts.md` 反映 D-NEW-04 Azure OpenAI
- [ ] SP List Comments + Likes 設定（D-NEW-05）
- [ ] 邀請 BG ambassadors 認領 baseline 案例（D-C4-5）

---

## 2026-05-19 — DP-1: Canonical Schema Lock (V5 38 cols)

### Decision
SP List canonical schema = **V5 34 cols + 4 SP-only adopted = 38 cols total**。Demo (V5 SSOT Excel) = SP 上線後對外樣貌。

### Rationale
- Demo 看到的 Before/After 對比、Owner card、Quote testimonial、Build Story 等 V5 故事欄是案例庫對 Vicky / 集團員工的**核心價值**
- 既有 SP List 13 半中文編碼欄（`OData__x75db__x9ede_` 等）為技術債，不適合扛
- SP spec 19 英文欄缺 V5 17 個故事欄，要補
- 三套對齊到 V5 後，前端 schema mapping 簡化，未來 SP / Excel 互通容易

### 38-col composition

| Group | Cols | Source |
|---|---|---|
| Identity & summary | 6 | V5 (含 `Stage_Norm` Choice 新加 — Gap 2 resolution) |
| Before/After narrative | 5 | V5 (核心敘事，SP spec 原缺) |
| IPO engineering view | 4 | V5 + SP spec naming `*JSON` |
| Story & owner | 7 | V5 (Owner card + Quote + Build_Story) |
| V5 card alignment | 3 | V5 (Category_Matrix / ECRS / Maturity_Indicator) |
| SP-only adopted | 3 | SP spec (`Reviewer` / `EvidenceUrl` / `SourceChannel`) |
| Provenance | 4 | V5 + SP spec |
| Lifecycle (Publish_Status axis) | 4 | V5 (Draft / Active-Internal / Active-Published / Archived) |

### Implications
- **既有 SP `AI案例庫` 13 半中文 schema → DEPRECATED**
- 新建 `AICases_v2` list 用 canonical 38 cols（Migration Option B parallel + sunset）
- `backend/sp-list-schema.md` 已更新（v2）
- `backend/deploy-sharepoint.ps1` Step 5 已擴充（19 個 PnP `Add-PnPField` 命令）
- `scripts/build_ssot.py` 已加 `Stage_Norm` + 3 個 SP-only 欄
- `ai-cases-ssot.xlsx` 已從 34→38 cols（2026-05-19 rebuild）
- `cases.json` 已重新產（schema 自動跟著 SSOT）

### Stage normalization (Gap 2 sibling lock)

| Stage_Norm | n | 含意 |
|---|---|---|
| Deploy | 35 | 已上線 / 穩定運行 |
| Development | 11 | MVP 完成 / Kickoff / 進行中 |
| Prototype | 21 | POC / 評估 / 測試 / 個人試用 |
| Planning | 20 | 需求 / 提案 / 規劃 |
| Stalled | 11 | 卡點 / On Hold / 結案無持續 |

雙軸保留：`Stage` (verbatim 58 種) + `Stage_Norm` (5-bucket)。SP List View 用 `Stage_Norm` filter，detail page 顯示 `Stage` raw 字串保留情境。

### Migration plan
- Option A 砍重建 / Option B parallel & sunset (建議) / Option C in-place — 詳見 `backend/sp-list-schema.md`
- Phase 1 工作流：用 `scripts/excel_to_splist.py`（待寫）把 SSOT 98 case 灌入 `AICases_v2`

---

## 2026-05-19 — DP-2: 3-Tier Hierarchy (Company / Unit / Region)

### Decision
SSOT 38→41 cols，加 Company / Unit / Region 三個 derived 欄位，由 `parse_bg()` 從 BG verbatim 自動解析。前端 filter 改成 3 排階層 chips（公司 → 單位 → 區域），cascade selection。

### Sub-decisions
- **Company 只 2 值**：`PMX / TYM`（Group / 集團 / DTO 統一歸 PMX，因 PMX 為母公司主導集團議題）
- **BG / BU 全部放單位層**（iIBG / iBG / CMBU / ISB / SAE / CAE 等都是 Unit）
- **Region 只認已知地理 region**：HZ / DG / CN / TW / TH / SG / HK / JP / KR / 泰國 / 全集團。業務描述（如「TW 招募」「泰國招聘」「SAE」）保留進 Unit verbatim
- **Owner override 機制**：parse_bg() 是 auto-fill，Excel 內 Company/Unit/Region 欄位可手動覆寫，rebuild 時不覆蓋已填的值

### Distribution (98 cases)

| Company | n | 比例 |
|---|---|---|
| PMX | 67 | 68% |
| TYM | 31 | 32% |

### Affected files
- `~/...-data/scripts/build_ssot.py`: +parse_bg() / _COMPANY_ALIAS / _KNOWN_REGIONS / 3 new cols
- `~/...-data/ai-cases-ssot.xlsx`: 38→41 cols (Company/Unit/Region inserted after BG)
- `~/...-data/scripts/excel_to_json.py`: WEB_FIELDS += Company/Unit/Region
- `~/...-cases/cases.json`: regenerated
- `~/...-cases/index.html`: 4-row filter (Company/Unit/Region/Stage) cascade
- `~/...-cases/backend/sp-list-schema.md`: Identity section 6→9 cols
- `~/...-cases/backend/deploy-sharepoint.ps1`: Step 5 caseFields +3 (Company Choice 2 值)

---

## 2026-05-21 — D-C4 Carry-over Lockdown + DP-3~7 Decisions

10 項 pending decisions（5/23 deadline）今天全部拍板。

### D-C4-1: 表單載體 — **Microsoft Forms + Power Automate flow**
- Why: 員工最熟悉 Forms UI / 可外連分享；flow 用 service account 寫 List 符合 D-NEW-02
- Implication: 需 Power Automate Premium license (HTTP connector)；對接 D-NEW-04 Azure OpenAI
- Status: ✅ Locked

### D-C4-2: 送件作為上架前置 — **不強制送件作為 gate；DTO review 為唯一上架閘門**
- **Glen 修正建議方向**：原 recommendation「強制送件 = 必要條件」過度結構化。送件動作本身不是真實 gate，**DTO review 才是真實品質閘門**。
- Implication:
  - Status flow: 任何來源 (Forms / Interview / Baseline import / Migrated) → `Status=Draft` 進審 → DTO review → `Status=Active-Internal` 或 `Active-Published`
  - 不需要區分「有送件 vs 沒送件」分支邏輯
  - SP List 上的 SourceChannel 仍記錄來源（Form/Interview/Migrated）但不影響 lifecycle
- Status: ✅ Locked

### D-C4-3: Benefits 量化規則 — **送件單位自行量化（送件時即必附）**
- **Glen 修正建議方向**：原 recommendation「Draft 階段選填 / Published 階段必填」放鬆過頭。**送件單位自己提出量化證據，DTO 不替你補**。
- Implication:
  - Microsoft Forms 表單欄位 `Benefits 量化` + `EvidenceUrl` 設為**送件必填**（required input）
  - 送件當下如沒寫量化數字 → Forms 拒收（client-side validation）
  - DTO review 階段檢查證據是否實在，不檢查「有沒有寫」
  - 對於既有 baseline 98 case：Active-Internal 13 案要求補齊；Draft 85 案 owner 補完才能升 Active-Internal
- Implication on `form-channel-spec.md`: 加 Required validation rules
- Implication on `deploy-sharepoint.ps1`: EvidenceUrl Type=URL，所有 Active-Internal+ 案須有值（List validation）
- Status: ✅ Locked

### D-C4-4: 送件審核流程 — **Glen + Vicky 二人 review（DTO 邊界 = Glen + Vicky）**
- **D-NEW-02 open question 同步解答**：DTO team = Glen + Vicky (only)；BG ambassador 不算 DTO 編制
- Why: Bottleneck 風險低（8 小時/週 cadence 足以處理 20-30 case 週量）+ 品質紀律
- Implication:
  - SP List `Contribute` permission = `Glen + Vicky` 兩位
  - BG ambassador role = 推薦案例 + baseline metadata 認領（D-C4-5），不直接寫 List
  - Service Account (DP-4) 寫入 List 走「Add Item only」權限，不能改 lifecycle status
  - Lifecycle status 改動 audit log 記錄 Glen / Vicky username
- Status: ✅ Locked

### D-C4-5: 既有 98 baseline 補齊 metadata 責任 — **延後決定**
- **Glen decision**：等後端 pipeline 整理完（Phase 1 schema migration + SP List 上線）再決定誰補。**現在先處理後端 plumbing**。
- Why: Schema 還未在 SP 落地，前線 ambassador 沒有可寫的目標；先把骨架建好再分工
- Defer until: Phase 1 完成（migration 跑完 + SP List 6 view 設定好）
- Re-evaluate by: Phase 2 啟動前
- Status: ⏸ Deferred to Phase 1 done

---

### DP-3: Phase 1 publish 流程 — **Glen 手動逐案 Active-Published**
- Why: 第一輪 13 個 Active-Internal 案 + 後續升級案，逐案 review 是品質紀律
- Implication:
  - 不寫 batch promote script
  - Glen 在 SP List 開 Active-Internal view → 逐筆 verify IPO + Owner card + Evidence → 改 Status
  - Estimated work: ~1 hr for current 13 Active-Internal cases
- Status: ✅ Locked

### DP-4: Service Account 來源 — **Glen 個人 SA 先走 + 平行 IT 申請新 SA**
- Why: 不擋 Phase 1-2 timeline；Phase 3 cutover 換新 SA 避免 Glen 離職風險
- Implication:
  - Phase 1-2: Glen 個人 Entra App registration（自助 via [aad.portal.azure.com](https://aad.portal.azure.com)）→ Sites.Manage.All 範圍 → Power Automate flow + excel_to_splist.py 用此身分
  - 同時：Glen 提 IT ticket 申請 `DTO-AICases-SA` service account（無人對應，永久存在）+ App Registration
  - Phase 3 cutover：flow connection / migration script auth 換綁新 SA
- Risk: PnP Management Shell ClientId 若被 IT 擋（Gap 10）→ Glen 個人 App Registration 已是 fallback
- Status: ✅ Locked

### DP-5: 前端 SP 部署路徑 — **v2/ 全組上傳 SP Site Assets + iframe 嵌入 Modern Page**
- Why: 保留 v2/ 5-page portal UI 結構（PDD 漏斗 / Modal IPO 4 欄 / sidebar chat card / Owner card），SP Modern Page 用 Embed Web Part 嵌 iframe 即可上線
- Implication:
  - `deploy-sharepoint.ps1` Step 6 `$FilesToUpload` 擴充：上傳 `v2/home.html` / `v2/cases.html` / `v2/cases-prototype.html` / `v2/cases-development.html` / `v2/cases-deploy.html` / `v2/shared.css` / `v2/shared.js` / `v2/auth-gate.js` (內網不需 password 可移除) / `assets/*` 圖檔
  - Site Assets 路徑：`<site>/SiteAssets/primax-ai-cases/v2/...`
  - iframe src 指向 `<site>/SiteAssets/primax-ai-cases/v2/home.html`
  - v2 `shared.js` 改 fetch 邏輯：優先 `/_api/web/lists/getbytitle('AICases_v2')/items`，fail 時 fallback 到 cases.json
  - 內網部署 password gate 移除（D-NEW-01 全集團可見已是 SP permission 控制）
- Phase 1 vs Phase 2 拆分：
  - Phase 1: 只上傳檔案 + 確認 iframe 能 load 靜態 cases.json
  - Phase 2: 改 SP REST live fetch + Comments/Likes endpoints
- Status: ✅ Locked

### DP-6: Phase 1-2 訪談錄音 channel — **不啟用**
- Why: 簡化 Phase 1-2 channel scope；own-voice-get 是 Glen 個人工具，scale 到 channel 1 萃取需要 Power Automate Desktop 或 cloud Speech-to-Text，IT 依賴沉重
- Implication:
  - `flows/extraction-flow.md` Flow 1 (Channel 1 Interview Extraction) Phase 1-2 不 build
  - Channel 1 限定 docx / md / pdf 為 Phase 1-2 input
  - D-NEW-03 「不強制 Teams，任何來源都收」原則保留為 architecture-level support，但 phase rollout 限縮
  - Phase 3 reconsider：屆時若 Azure OpenAI + Speech-to-Text resource 都到位再評估開錄音 channel
- Status: ✅ Locked (Phase 1-2 only)

### DP-7: Phase 1 vs Phase 2 並行 — **序列：Phase 1 全部完成才 Phase 2**
- Why: 控制 cognitive load + migration script 風險先收斂 + Glen single-person bandwidth
- Implication:
  - Total timeline: ~4 週（Phase 1 2 週 + Phase 2 2 週）+ Phase 3 IT-gated
  - Phase 1 exit criteria 全達標才動 Phase 2 任何 task
  - 不啟動 Forms 建表 / flow build / 前端切 REST 等 Phase 2 工作
- Trade-off accepted: 比並行慢 ~1 週，但確保 Phase 1 schema migration 完全收斂
- Status: ✅ Locked

---

## Action Items After 2026-05-21 Lockdown

按 priority：

- [ ] **P0 Phase 1 Task 1** — Glen 親自登入 SP 確認 `https://primaxgroup.sharepoint.com/sites/DTO-Office/` 存在 + 既有 AI案例庫 狀態截圖（30 min, Glen-only）
- [ ] **P0 Phase 1 Task 2** — Glen 申請 Entra App Registration（自助）→ 取得 ClientId + ClientSecret（Glen 個人 SA, DP-4）
- [ ] **P0 Phase 1 Task 3** — `deploy-sharepoint.ps1` 跑 `AICases_v2` list 建立 + 41 cols 全建（含 Company Choice / Stage_Norm Choice / EvidenceUrl URL）+ AI_Prompts + AI_Events
- [ ] **P0 Phase 1 Task 4** — 寫 `scripts/excel_to_splist.py`（Gap 8）：SSOT 98 cases → AICases_v2 with `Status=Draft` / `SourceChannel=Migrated`
- [ ] **P1 Phase 1 Task 5** — Glen 手動把 13 Active-Internal 案逐案 review + 改 `Status=Active-Published`（DP-3）
- [ ] **P1 Phase 1 Task 6** — SP List Comments + Likes 手動啟用（D-NEW-05）+ 6 standard views 建立
- [ ] **P1 Phase 1 Task 7** — `deploy-sharepoint.ps1` Step 6 擴充：上傳 v2/ 5 頁 + shared.{css,js} + assets/（DP-5 預先上靜態版）

- [ ] **P2 Phase 2 Task 1**（Phase 1 全完才動）— v2/shared.js 改 SP REST live fetch with cases.json fallback
- [ ] **P2 Phase 2 Task 2** — Microsoft Forms 依 `docs/form-channel-spec.md` 建表 + Benefits 量化 / EvidenceUrl 都設 Required（D-C4-3）
- [ ] **P2 Phase 2 Task 3** — Power Automate flow: Forms → SP List Draft + Teams notify Glen+Vicky（D-C4-4 review queue）
- [ ] **P2 Phase 2 Task 4** — SP Modern Page 建 + Embed Web Part iframe v2/home.html

- [ ] **P3 D-C4-5 Re-evaluation**（Phase 1 完成後）— baseline metadata 補齊責任分工

- [ ] **P3 IT alignment**（Phase 3 prerequisite, parallel track）— 提 IT ticket：DTO-AICases-SA + Azure OpenAI (TW region) + Power Automate Premium

