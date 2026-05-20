# SharePoint List Schema (Canonical v2, 2026-05-19)

> SP site: `https://primaxgroup.sharepoint.com/sites/DTO-Office`
> **Canonical schema = V5 38 cols (locked by Glen 2026-05-19, see DECISIONS.md DP-1)**
> 既有 13 半中文編碼 schema → **DEPRECATED**，新建 list `AICases_v2` 或砍 rebuild。

---

## Decision context

依 DP-1 Glen 拍板：**Demo (V5 schema) = SP 上線後樣貌**。因此 SP List schema 對齊 V5 SSOT Excel，砍既有 13 欄半中文編碼欄名。

從 V5 34 + SP spec 獨有 4 = **38 cols canonical**：

- **V5 34 cols** 全部保留（含 Before/After/Owner card/Quote/Build_Story 等敘事欄）
- **SP spec 4 cols 補入**：`Reviewer` (Person) / `EvidenceUrl` (URL) / `SourceChannel` (Choice) / 加 `Stage_Norm` (Choice)
- SP spec 內 `PublishedDate` 跟 V5 `Publish_Date` 重複 → 統一用 `Publish_Date`

---

## List 1: `AICases_v2` (38 cols canonical, 待建)

> 命名 `_v2` 區別既有半中文 list；上線前是否合併 / 改名由 deployment cutover plan 決定。

### Identity & summary (9)
| Internal Name | Display | Type | Required | Choices / Notes |
|---|---|---|---|---|
| Title | 案例名稱 | Single line | ✓ | 對應 V5 IPO `title`，< 30 字 |
| BG | 部門 / BG (verbatim) | Single line | ✓ | 原始 source 用詞，如 "TYM-HR (HZ)" / "PMX-iIBG" |
| Company | 公司層級 | Choice | ✓ | **PMX / TYM** (僅 2 值, Glen 2026-05-19 lock; Group/集團/DTO 歸 PMX) — auto-parsed from BG, owner 可手動覆寫 |
| Unit | 單位 | Single line | ✓ | HR / IT / F&A / iIBG / MTC / CMO …（auto-parsed from BG）|
| Region | 區域 | Single line | | HZ / DG / CN / TW / TH / 全集團 …（auto-parsed when BG 標記了地理 region）|
| Tools | 工具 | Single line | ✓ | 如 "Python + VBA" / "Power Automate + GenAI" |
| Benefits_Summary | 效益摘要（卡片底） | Single line | ✓ | 一句話，< 60 字 |
| Stage | 階段 (verbatim) | Single line | ✓ | 抄原文，不限 enum |
| Stage_Norm | 階段標準化 | Choice | ✓ | **Deploy / Development / Prototype / Planning / Stalled / Other** (Gap 2 resolution) |

### Problem & Before/After narrative (5) — V5 故事核心
| Internal Name | Display | Type | Required | Notes |
|---|---|---|---|---|
| Pain_Point | 痛點 | Multi-line | ✓ | Modal 第 1 段 |
| Before_How | 導入前怎麼做 | Multi-line | | Modal Before/After 區塊—左欄 |
| Before_Pain | 導入前痛感 | Multi-line | | Modal Before/After—左欄底部 |
| After_How | 導入後怎麼做 | Multi-line | | Modal Before/After—右欄 |
| After_Outcome | 導入後結果 | Multi-line | | Modal Before/After—右欄底部 |

### IPO engineering view (4)
| Internal Name | Display | Type | Notes |
|---|---|---|---|
| Input | 資料來源 | Multi-line | 內容為 \n 分隔的 list；Power Automate parse 時 split |
| Process | 處理流程 | Multi-line | 同上 |
| Output | 產出形式 | Multi-line | 同上 |
| Benefits | 完整效益 | Multi-line | 同上 |

### Story & owner (7)
| Internal Name | Display | Type | Notes |
|---|---|---|---|
| Build_Story | 怎麼做出來的 | Multi-line | owner 親述試錯/學習路徑 |
| Owner_Name | 負責人姓名 | Single line | 或 Person 型（如 SP 內可解析）|
| Owner_Role | 職稱 | Single line | |
| Owner_Dept | 部門 | Single line | |
| Owner_Background | 經歷 | Multi-line | 一句話 |
| Owner_Photo | 照片 URL | URL | optional |
| Owner_Email | 聯絡 email | Single line | |
| Quote | Owner 想表達的話 | Multi-line | testimonial |

### V5 Card alignment (3) — 從 V5 案例卡 Glen 親手定義
| Internal Name | Display | Type | Choices |
|---|---|---|---|
| Category_Matrix | 分類矩陣 | Choice | 個人×RPA / 個人×AI / 組織×RPA / 組織×AI / 合併 |
| ECRS | ECRS 法則 | Single line | E / C / R / S / 組合（如 E+S）|
| Maturity_Indicator | 成熟度燈號 | Choice | 🟢 穩定運行 / 🟡 進行中 / 灰（6 月未更新）|

### SP-only adopted (3) — from SP spec
| Internal Name | Display | Type | Required | Notes |
|---|---|---|---|---|
| Reviewer | 審核人 | Person | | DTO reviewer 指派 |
| EvidenceUrl | 證據連結 | URL | conditional | **Status=Active-Published 時必填** (D-C4-3) |
| SourceChannel | 來源 channel | Choice | ✓ | Interview / Form / Migrated（baseline import 預設 Migrated）|

### Provenance (4)
| Internal Name | Display | Type | Notes |
|---|---|---|---|
| Source_Meeting | 內容來源追溯 | Single line | 案例卡V5.pptx Slide 8 / Group HR sharing 2025-07-15 #4 |
| Verification_Status | 驗證狀態 | Choice | Draft / Single-source / Verified / Owner-confirmed |
| Last_Updated | 最後更新日 | DateTime | auto (Modified) |
| Updated_By | 最後更新人 | Person | auto (Editor) |

### Lifecycle (4) — Publish_Status axis (Gap 1 dual-axis design)
| Internal Name | Display | Type | Choices |
|---|---|---|---|
| Publish_Status | 發佈狀態 | Choice | **Draft / Active-Internal / Active-Published / Archived** |
| Publish_Date | 首次公開日期 | DateTime | 設 Active-Published 時填 |
| Archive_Date | 下架日期 | DateTime | 設 Archived 時填 |
| Archive_Reason | 下架理由 | Single line | 業主撤回 / 案例退役 / 資料過時 / 隱私 / 合規 |

---

## Stage normalization rules (Gap 2)

SSOT Excel 內 58 種 Stage verbatim → 5 buckets。所有對應由 `scripts/build_ssot.py::STAGE_NORM_MAP` 維護。

| Stage_Norm | n | 範例 verbatim |
|---|---|---|
| Deploy | 35 | 已上線 / 穩定運行 / 已完成上線 / 已落地 / Expanding / 運行中 / Deployment |
| Development | 11 | MVP 完成 / Kickoff / Development / 進行中 / 報表完成 |
| Prototype | 21 | POC 階段 / 測試中 / Phase 1 / 個人運行 / 雙軌規劃 / 評估中 / 技術評估完成 |
| Planning | 20 | 需求/規劃 / 提案規劃 / Phase 2 / POC 規劃 / Phase 0 流程自動化 |
| Stalled | 11 | 結案-未確認運維狀態 / 卡點—資料權限 / On Hold / POC 結束 |

SP List 前端 filter 一律用 `Stage_Norm`；DTO 維護介面用 `Stage` 看 raw verbatim。

---

## Views (6 standard, 待建)

| View 名 | Filter | 用途 |
|---|---|---|
| Published (default) | Publish_Status = Active-Published | 對外展示 |
| Active-Internal | Publish_Status = Active-Internal | DTO 內部 preview，待升級 |
| Draft Queue | Publish_Status = Draft | DTO review queue |
| Archived | Publish_Status = Archived | 歷史保留 |
| By BG | Group by BG, sort by Stage_Norm | 部門總覽 |
| Recent | Sort by Last_Updated desc | 最新動態 |

---

## Comments + Likes (D-NEW-05)

- List settings → Advanced settings → "Allow comments" = Yes
- List settings → Rating settings → "Allow items in this list to be rated" = Yes → 選 "Likes"
- 前端 hub-dynamic.html / index.html 需呼叫 SP Comments REST endpoint：
  - GET `/_api/web/lists/getbytitle('AICases_v2')/items(<id>)/Comments`
  - POST 新增評論
- Likes：`/_api/web/lists/getbytitle('AICases_v2')/items(<id>)/Like` (POST)

---

## List 2: `AI_Prompts` (待建，沿用既有 spec)

員工分享好用 Prompt。`deploy-sharepoint.ps1` Step 3 建立。

| Internal Name | Display | Type | Choices |
|---|---|---|---|
| Title | Prompt 標題 | Single line | — |
| Department | 部門 | Choice | HR / IT / FA / RD / MFG / ESG / GEN |
| UseCase | 應用情境 | Single line | — |
| PromptBody | Prompt 內容 | Note | — |
| Tools | 適用工具 | Single line | 如 "Copilot / ChatGPT" |
| Author | 作者 | Single line | — |

---

## List 3: `AI_Events` (待建，沿用既有 spec)

DTO 辦的 AI 活動/分享會紀錄。`deploy-sharepoint.ps1` Step 4 建立。

| Internal Name | Display | Type |
|---|---|---|
| Title | 活動名稱 | Single line |
| EventDate | 活動日期 | DateTime |
| Host | 主辦 / 講者 | Single line |
| Audience | 對象 | Single line |
| Highlights | 重點摘要 | Note |
| SlidesUrl | 簡報連結 | URL |
| VideoUrl | 錄影連結 | URL |
| DocumentUrl | 文件連結 | URL |

---

## Migration from existing list

既有 `AI案例庫` 13 半中文編碼欄位 → 退役方案：

| Option | 做法 | 風險 |
|---|---|---|
| **A. Hard cutover** | 砍 `AI案例庫`，新建 `AICases_v2`，全部資料從 SSOT Excel 重灌 | 既有 SP 資料若有手動編輯會丟失 |
| **B. Parallel & sunset** | 保留 `AI案例庫` 為唯讀，新建 `AICases_v2` 為主；3 個月後砍舊 | 雙重 list 期間需引導使用者 |
| **C. In-place migration** | 在既有 `AI案例庫` 加 25 個英文新欄位，把半中文欄位資料人工搬移後棄用 | OData 編碼欄位永久殘留為 deprecated 欄 |

**建議 B**：保留歷史記錄，降低 cutover 風險。

---

## Service Account 寫入（D-NEW-02）

非 DTO 員工不直接寫 list（D-NEW-02）。改用：
1. Microsoft Forms 收件
2. Power Automate flow 觸發
3. Flow 以 service account 身分 `POST /_api/web/lists/getbytitle('AICases_v2')/items` 建 `Publish_Status=Draft` 項目
4. DTO team 在 SP List 直接編輯 → `Publish_Status=Active-Internal` → review → `Active-Published`

Service account 申請：對齊 `project_ms_ai_playbook` B2 (Entra App Registration with `Sites.ReadWrite.All` / `Lists.ReadWrite`)。

---

## PnP ClientId

`31359c7f-bd7e-475c-86db-fdb8c937548e` (PnP Management Shell 官方)。若 IT 封鎖，需 IT 註冊內部 Entra App（`Sites.Manage.All`）替換。

---

## Deprecated: existing `AI案例庫` 13 half-Chinese schema

⚠️ DO NOT USE — kept here for migration reference only.

| Internal Name | Display | Type | 對應 canonical |
|---|---|---|---|
| Title | 案例名稱 | Single line | → `Title` |
| Summary | 摘要 | Single line | → `BenefitsSummary` |
| OData__x75db__x9ede_ | 痛點 (編碼) | Note | → `PainPoint` |
| InputData | Input | Note | → `InputJSON` |
| ProcessSteps | Process | Note | → `ProcessJSON` |
| OutputResult | Output | Note | → `OutputJSON` |
| BenefitNote | Benefits | Note | → `BenefitsJSON` |
| OData__x516c__x53f8_ | 公司 (編碼) | Single line | → 拆 BG 或新加 Company |
| BusinessUnit | 單位 | Single line | → `BG` |
| AI_Type | AI 類型 | Choice | → `Category_Matrix` (定義不同，需 Glen 重新對應) |
| Stage | 階段 | Choice | → `Stage` + `Stage_Norm` |
| SourceNote | 來源 | Single line | → `Source_Meeting` |
| Insight | 觀察 | Note | → (canonical 無對應，可丟棄或加新欄)|
