# Form Channel Spec (Channel 2)

> **Origin**: 2026-05-18 DTO 藍圖工作會議 Action Item A5。memory `project_dto_use_case_form.md` 已 supersede 並合併進此檔。
> Vicky 在會議中明確要求：「我們要去統計這個」「他要送到你這邊來的時候應該就要提供」「你就不用來回去收集」

---

## 定位

集團每個 BG/Fun 用了什麼 AI、做了什麼事、節省多少時間，員工**送件**（不來回收集），整合進 SP 學習專區 + 集團年度成果報告。

---

## 表單欄位 (Microsoft Forms)

### Section 1：進場條件 (Entry Gate, 4 勾選必過)

設計初衷：**前置自我把關**，降低 reviewer 負擔；4 條都打勾才能進到 Section 2。對應「不要設計過多必填」反例 — 進場條件不算欄位 friction，是品質底線。

| # | 勾選句 | 把關意圖 | 對應決策 |
|---|---|---|---|
| 1 | ☐ **真實使用過**：我或我的單位實際完成過至少 1 次完整 Input→Process→Output 循環（不是構想 / 不是 demo / 不是聽說別人在做） | 過濾「想做但還沒做」案例 | 對齊 V5 IPO 6 欄位定義 |
| 2 | ☐ **有可舉證效益**：能用時間、數量、品質、員工體驗任一面向說明效益（不要求精準數字，但要能具體舉例） | 過濾「我覺得很有用」無事實案例 | D-C4-3 Draft 選填證據但要可舉證 |
| 3 | ☐ **合規可控**：使用的 AI 工具屬於集團合規清單（Copilot / Azure OpenAI / Claude 企業版 / Power Platform AI Builder 等），或敏感資料已脫敏處理；沒有把客戶/員工/供應商個資餵給非合規外部 AI | 過濾合規風險案例 | D-NEW-04 內網優先 + PIPL/GDPR |
| 4 | ☐ **同意公開**：同意此案例在集團 SharePoint AI 學習專區**全集團可見**，含我的姓名、單位、Use Case 內容 | 過濾隱私顧慮 | D-NEW-01 全集團可見 |

**Forms 實作**：4 個 Yes/No required 題（不要用 multi-checkbox 單題，避免員工全勾不看內容）。Power Automate gate：4 題全為 Yes 才繼續 step 2；任一 No 則回覆「請先確認 4 項進場條件，必要時可聯絡 DTO ambassador 協助評估」。

對應 SP List：`EntryGate_RealUse / EntryGate_HasEvidence / EntryGate_Compliant / EntryGate_AgreePublic`（4 個 Yes/No 欄位，保留可稽核足跡；不在前端 detail page 顯示，僅 reviewer view 看得到）。

---

### Section 2：案例內容

| 欄位 | 必填 | Type | 對應 SP List |
|---|---|---|---|
| BG / Fun | ✓ | Choice | `BG` |
| Use Case 名稱 | ✓ | Short text | `Title` |
| 階段 | ✓ | Choice (Prototype/Development/Deploy) | `Stage` |
| Tool 大類 | ✓ | Choice (通用對話 AI / 企業 AI 平台 / AI 開發工具) | (拼入 `Tools`) |
| Tool 具體名稱 | ✓ | Short text | (拼入 `Tools`) |
| Category | ✓ | Choice multi (10 類，沿用 AI Empowerment Deck) | `Category` |
| 痛點描述 | ✓ | Long text | `PainPoint` |
| Input 來源 | ✓ | Long text (one per line) | `InputJSON` |
| Process 步驟 | ✓ | Long text (one per line) | `ProcessJSON` |
| Output 形式 | ✓ | Long text (one per line) | `OutputJSON` |
| Benefits 量化 | ✓ | Long text (one per line, 至少一條含數字) | `BenefitsJSON` |
| Benefits 一句摘要 | ✓ | Short text | `BenefitsSummary` |
| **對自己的幫助（一句感想）** | ✓ | Short text (≤80字) | `PersonalQuote` |
| 證據連結 | △ (Draft 選填 / Published 必填) | URL | `EvidenceUrl` |
| 送件人 Email | auto | (Forms 自動帶) | `Owner` |

**「對自己的幫助」欄位設計**：
- 一句話、限 80 字，提示文字：「以前 ___，現在 ___」格式參考
- 範例 1：「以前要花 2 小時整理會議重點，現在 10 分鐘就有初稿，週末多了陪小孩的時間」
- 範例 2：「以前每月底加班 3 天清資料，現在排程跑完就好，可以準時下班接小孩」
- 範例 3：「以前不敢做需要寫 SQL 的分析，現在自己也能查到答案，比較有掌握感」
- 不寫工具 / 不寫部門效益（那是 BenefitsSummary 在說的）— 這欄專寫「對我個人的改變」
- 對應 V5 schema 的 `Quote_Testimonial`（DECISIONS DP-1 38-col canonical schema, Story & owner group）
- 在 Tier 2 Detail Modal 的 Owner Card 區塊顯示為引用樣式（quote block）

送件後自動：
- `Status = Draft`
- `SourceChannel = Form`
- `SourceRef = <Forms response ID>`
- `SubmittedDate = now()`
- `EntryGate_*` 4 欄記錄勾選狀態（4 全 Yes 才會進到這步）

---

## 後端流程

```
員工填寫 Microsoft Forms
       ↓
Power Automate flow trigger: "When a new response is submitted"
       ↓
Get response details
       ↓
【Gate 0】4 個 EntryGate_* 全 Yes？
   ├─ No  → Teams DM 送件人「請確認 4 項進場條件，可洽 DTO ambassador 協助評估」+ flow terminate
   └─ Yes → 繼續
       ↓
Parse JSON-line fields (Input / Process / Output / Benefits) into JSON arrays
       ↓
(Optional) Call Azure OpenAI to 清理 / 規範化欄位（D-NEW-04）
       ↓
PII redaction pass (regex + LLM 二次掃描)
       ↓
SP List "AI案例庫" Create item (Status=Draft, SourceChannel=Form, EntryGate_* 全 Yes)
       ↓
Teams notification to DTO team channel: "新送件 from <name>, click to review"
       ↓
DTO reviewer 開 SP List item → 編輯 → Status=Published（前提：EvidenceUrl 已填，D-C4-3）
       ↓
Teams notification to BG channel: "你們部門案例已發布"
```

完整 flow 設計見 [`flows/extraction-flow.md`](../flows/extraction-flow.md)。

---

## 已有 baseline (不要從零做)

| 來源 | 內容 | 用途 |
|---|---|---|
| `09-AI-Adoption-Status/集團數位轉型專案進度20260331.pptx` | 8 案例卡（已有 BG / Use Case / Tools / Benefits 結構）| 欄位範本 |
| `09-AI-Adoption-Status/build_unit_progress_pptx.py` | 自動生 PPTX 腳本 | 改寫成「讀 SP List → 生 Slide 8」 |
| `0517_short.pptx` Slide 12 | 20+ 案例分佈三階段 | 第一批灌入內容 |
| `09-AI-Adoption-Status/PMX_IT-PLM 內部客戶報告AI審查.mp4` | 示範影片 | 案例證據範本 |
| `09-AI-Adoption-Status/TYM_IT-BPM 請假Agent.mp4` | 示範影片 | 案例證據範本 |

---

## 待 Glen 決策 (deadline 2026-05-23)

5 項 D-C4-1~5 carry-over 完整內容見 [`../DECISIONS.md`](../DECISIONS.md)，本檔僅引述：

- **D-C4-1**: 表單載體 → 建議 Microsoft Forms + Power Automate → SP List
- **D-C4-2**: 送件 = 上架前置（強制）
- **D-C4-3**: 證據連結 Draft 選填 / Published 必填
- **D-C4-4**: 審核流程 — 待 "DTO" 邊界澄清
- **D-C4-5**: 既有 20+ 案例 metadata 補齊由各 BG ambassador 認領

---

## Scope distinction — 兩個 AI Pilot KPI 並存 (2026-05-18 確認)

| KPI 來源 | 對象 |
|---|---|
| Slide 4 「3-5 項 AI Pilot Projects, ≥10%」 | 集團 DTO 政策性 KPI（對外宣示）|
| Vicky KPI 「Glen+IT+COE = 3 個 Agent Pilot」 | Vicky 管理轄下單位的個人 KPI |

兩個 KPI 是不同 scope，不是同一指標的兩種說法。本表單同時餵兩個 KPI 但統計口徑不同。詳見 `~/.claude/memory/project_vicky_kpi_2026.md`。

---

## 對接其他 Action Items

- **A1** ambassador 盤點：D-C4-4 + D-C4-5 都需要 ambassador 名單先確定
- **A3** ambassador 機制：D-C4-4 審核流程是機制的一部分
- **A4** SP 學習專區：D-C4-2 送件 = 上架是流程設計的關鍵假設
- **A8** 5/19 DX 例會：表單草案先給其他人看一輪

---

## 反例 (避免重蹈)

- ❌ 不要加 L1-L4 欄位 (Jack 個人理解，不是正式分類) — 見 2026-05-18 C1 決策
- ❌ 不要為每個 BG 開獨立表單（會回到「來回收集」）
- ❌ 不要設計過多必填欄位（送件 friction 太高 = 沒人送）— 進場條件 4 勾選不算 friction，是品質底線
- ❌ 不要讓送件直接寫 SP List（違反 D-NEW-02 寫入權限限定）
- ❌ 進場條件不要做成單題 multi-checkbox（員工會全勾不看內容）— 改 4 個獨立 Yes/No 題
- ❌ 「對自己的幫助」感想欄不要拿 BenefitsSummary 套用（部門效益 vs 個人感受是兩件事）
- ❌ 進場條件 4 欄不要在前端 detail page 顯示（只給 reviewer view 看，避免員工事後修勾選逃避責任）

---

## 對接其他規格檔

| 規格檔 | 關係 |
|---|---|
| [`spec.md`](spec.md) §3 Field Mapping | V5 IPO 6 欄位對應，本檔 Section 2 欄位表是其前端輸入面 |
| [`spec.md`](spec.md) §5 Governance | Gate 0 進場條件 + Gate (Draft→Published EvidenceUrl required) 是兩道 gate，本檔負責 Gate 0 |
| [`../backend/sp-list-schema.md`](../backend/sp-list-schema.md) | 需新增 5 個欄位：`EntryGate_RealUse / EntryGate_HasEvidence / EntryGate_Compliant / EntryGate_AgreePublic`（Yes/No）+ `PersonalQuote`（Single line text, 80字）|
| [`../backend/deploy-sharepoint.ps1`](../backend/deploy-sharepoint.ps1) Step 5 caseFields | 上述 5 欄位要加進 `Add-PnPField` 清單 |
| [`../flows/extraction-flow.md`](../flows/extraction-flow.md) | Gate 0 邏輯實作詳見此檔 |
| [`../DECISIONS.md`](../DECISIONS.md) DP-1 | 38-col canonical schema 應 update 為 43 cols（38 + 5），下次決策時 lock |
