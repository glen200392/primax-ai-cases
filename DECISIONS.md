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

