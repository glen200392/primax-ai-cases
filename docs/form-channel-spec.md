# Form Channel Spec (Channel 2)

> **Origin**: 2026-05-18 DTO 藍圖工作會議 Action Item A5。memory `project_dto_use_case_form.md` 已 supersede 並合併進此檔。
> Vicky 在會議中明確要求：「我們要去統計這個」「他要送到你這邊來的時候應該就要提供」「你就不用來回去收集」

---

## 定位

集團每個 BG/Fun 用了什麼 AI、做了什麼事、節省多少時間，員工**送件**（不來回收集），整合進 SP 學習專區 + 集團年度成果報告。

---

## 表單欄位 (Microsoft Forms)

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
| 證據連結 | △ (Draft 選填 / Published 必填) | URL | `EvidenceUrl` |
| 送件人 Email | auto | (Forms 自動帶) | `Owner` |

送件後自動：
- `Status = Draft`
- `SourceChannel = Form`
- `SourceRef = <Forms response ID>`
- `SubmittedDate = now()`

---

## 後端流程

```
員工填寫 Microsoft Forms
       ↓
Power Automate flow trigger: "When a new response is submitted"
       ↓
Get response details
       ↓
Parse JSON-line fields (Input / Process / Output / Benefits) into JSON arrays
       ↓
(Optional) Call Azure OpenAI to 清理 / 規範化欄位
       ↓
PII redaction pass
       ↓
SP List "AI案例庫" Create item (Status=Draft, SourceChannel=Form)
       ↓
Teams notification to DTO team channel: "新送件 from <name>, click to review"
       ↓
DTO reviewer 開 SP List item → 編輯 → Status=Published
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
- ❌ 不要設計過多必填欄位（送件 friction 太高 = 沒人送）
- ❌ 不要讓送件直接寫 SP List（違反 D-NEW-02 寫入權限限定）
