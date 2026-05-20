# HAND-OFF：form-channel-spec.md → 前端 session 合流動作清單

> **建立**：2026-05-19（form-spec 改動 session）
> **接手**：另一個正在改前端的 session
> **目的**：避免兩 session 同時動 backend 撞 schema。等前端改完，**一次合流**套用以下 4 個下游動作。

---

## 1. 我在 2026-05-19 改了什麼

只動 1 個檔：`docs/form-channel-spec.md`

- **Section 1 新增**：4 個進場條件 Yes/No 勾選（Entry Gate）
  - `EntryGate_RealUse` — 真實使用過（非構想/demo/聽說）
  - `EntryGate_HasEvidence` — 有可舉證效益
  - `EntryGate_Compliant` — 合規可控（合規工具清單 / 敏感資料脫敏）
  - `EntryGate_AgreePublic` — 同意集團公開（對齊 D-NEW-01）
- **Section 2 新增**：`PersonalQuote`（≤80字 short text，「對自己的幫助」一句感想）— 對應 V5 schema `Quote_Testimonial`，Tier 2 Owner Card quote block 顯示
- **後端流程**加 **Gate 0**：4 EntryGate 任一 No → Teams DM 退件 + flow terminate
- **反例**段加 3 條（multi-checkbox 陷阱 / 感想 vs BenefitsSummary 混淆 / EntryGate 不對員工顯示）

→ **總計新增 5 個 SP 欄位**：4 個 Yes/No + 1 個 Single line text

---

## 2. 等前端改完，合流時要做的 4 件事（按順序）

### Action 1 — `backend/sp-list-schema.md` 加 5 欄

在 schema 對應位置（建議 Governance group 或新建 EntryGate group）補：

```
| EntryGate_RealUse        | Yes/No        | Required | Form Gate 0 — 真實使用過       |
| EntryGate_HasEvidence    | Yes/No        | Required | Form Gate 0 — 有可舉證效益     |
| EntryGate_Compliant      | Yes/No        | Required | Form Gate 0 — 合規可控         |
| EntryGate_AgreePublic    | Yes/No        | Required | Form Gate 0 — 同意公開         |
| PersonalQuote            | Text (80)     | Optional | Owner card quote testimonial   |
```

對應 DECISIONS DP-1 38-col canonical 升為 **43 cols**。

### Action 2 — `backend/deploy-sharepoint.ps1` Step 5 `caseFields` 加 5 個 `Add-PnPField`

```powershell
Add-PnPField -List $listTitle -DisplayName "EntryGate_RealUse"      -InternalName "EntryGate_RealUse"      -Type Boolean -Group "Form Gate"
Add-PnPField -List $listTitle -DisplayName "EntryGate_HasEvidence"  -InternalName "EntryGate_HasEvidence"  -Type Boolean -Group "Form Gate"
Add-PnPField -List $listTitle -DisplayName "EntryGate_Compliant"    -InternalName "EntryGate_Compliant"    -Type Boolean -Group "Form Gate"
Add-PnPField -List $listTitle -DisplayName "EntryGate_AgreePublic"  -InternalName "EntryGate_AgreePublic"  -Type Boolean -Group "Form Gate"
Add-PnPField -List $listTitle -DisplayName "PersonalQuote"          -InternalName "PersonalQuote"          -Type Text    -Group "Story"
```

### Action 3 — `DECISIONS.md` 新增 DP-3 條目

```markdown
## 2026-05-20（或合流日） — DP-3: Canonical Schema 38 → 43 cols (Form Entry Gate)

### Decision
Canonical SP List schema 從 DP-1 38 cols 升為 **43 cols**，新增 5 欄：
- 4× EntryGate_* (Yes/No, Required) — Form Channel Gate 0 自我把關
- 1× PersonalQuote (Text 80) — Owner card quote testimonial（對應 V5 `Quote_Testimonial`）

### Rationale
- Form 送件 friction 控制 + 品質底線分離（進場條件不是欄位 friction）
- 個人感想欄位獨立於 BenefitsSummary（部門效益 vs 個人改變是兩件事）
- 對齊 D-NEW-01（全集團可見前置同意）+ D-NEW-04（合規前置確認）

### Affected files
- `docs/form-channel-spec.md` ✅ done 2026-05-19
- `backend/sp-list-schema.md` — Action 1
- `backend/deploy-sharepoint.ps1` Step 5 — Action 2
- `flows/extraction-flow.md` Gate 0 — Action 4
- 前端 detail page — **不顯示 EntryGate**，只顯示 PersonalQuote
```

### Action 4 — `flows/extraction-flow.md` 補 Gate 0 邏輯

在 Power Automate flow trigger 後、Get response details 後加：

```
【Gate 0】Condition: EntryGate_RealUse=Yes AND EntryGate_HasEvidence=Yes AND EntryGate_Compliant=Yes AND EntryGate_AgreePublic=Yes
  ├─ No  → Teams DM Action to <Owner email>:
  │         "您的 AI 案例送件未通過進場條件，請確認 4 項自我把關。
  │          需要協助請聯絡 DTO ambassador <BG 對應 ambassador>。"
  │       → Terminate flow (status: Failed, reason: "Gate 0 not passed")
  └─ Yes → 繼續 Parse JSON-line fields...
```

---

## 3. 跨檔影響檢查（前端 session 注意）

- ✅ **前端 detail page**：**不要顯示** EntryGate_* 4 欄（員工事後修勾選逃避責任的風險）— 只在 reviewer view 看
- ✅ **前端 detail page**：**要顯示** PersonalQuote — 在 Owner card 區塊 quote block 樣式
- ✅ **cases.json**：`excel_to_json.py` 需要把 5 個新欄位加進 `WEB_FIELDS`（PersonalQuote 必加；EntryGate 4 欄看要不要進 internal mode 供 reviewer audit）
- ✅ **Excel SSOT**：`ai-cases-ssot.xlsx` 43 cols（從 41 → 43，加 PersonalQuote + 4 EntryGate；既有 98 cases EntryGate 預設 Yes/灌入 baseline 用 SourceChannel=Migrated 不走 Gate 0）

---

## 4. 不在此 hand-off 範圍的 P1 動作

以下是 thinking-log `2026-05-19_primax-ai-cases-schema-canonical-and-pipeline-truth.md` 列的 P1，但跟 form-spec 改動無直接 dep，前端 session 可獨立決定要不要併單：

- D-C4-1~5 拍板（5/23 deadline）
- 「DTO team」邊界跟 Vicky 對齊（5/22 deadline）
- SP cutover Phase 1（Glen 親自登入 + 跑 deploy ps1 + 灌資料）
- `excel_to_splist.py` migration 工具
- `scripts/check_schema_consistency.py` 包腳本

---

## 5. 重要禁忌（傳遞給接手 session）

- ❌ **不要再跑 `build_ssot.py`** — 會 destroy 手動 Excel 編輯（safety prompt 已加但仍小心）
- ❌ 新案例不要直接寫 SP List — 走 D-NEW-02 service account flow
- ❌ EntryGate 4 欄不要設成單題 multi-checkbox（員工會全勾不看）— 必須 4 個獨立 Yes/No 題

---

## 6. 接手指引

當前端 session 改完 frontend 並準備合流時：
1. 讀本檔
2. 按 Action 1 → 2 → 3 → 4 順序執行
3. 跑 `python scripts/excel_to_json.py` 重 export cases.json
4. 提交時 commit message 引用本檔：`feat(schema): merge form-spec 43-col canonical (handoff doc)`
5. 動作完成後刪除本 hand-off 檔（或挪到 `docs/archive/`）
