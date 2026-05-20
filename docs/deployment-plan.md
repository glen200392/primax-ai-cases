# End-to-End Deployment Plan

> **Last updated**: 2026-05-19
> **Owner**: Glen
> **Status**: Blueprint v1 — Gap analysis + 3-phase rollout
> **Prerequisites**: `docs/spec.md` (master architecture) + `DECISIONS.md` (D-NEW-01~05 + D-C4-1~5)

---

## Part A — Asset audit (what already exists)

### Frontend assets

| Asset | Schema | Data source | Status |
|---|---|---|---|
| `index.html` (Glen revised 2026-05-19) | V5 case card (34 cols) | `cases.json` (static from Excel) | ✅ working preview |
| `hub-dynamic.html` (knowledge-hub absorbed) | SP List native (mixed CN/EN cols, OData-encoded) | SP REST API direct | ✅ working SP-connected |
| `style.css` | shared | — | ✅ |
| `cases.json` | 31 cases (Active-Internal mode) | from Excel | ✅ generated |

### Backend assets

| Asset | Purpose | Status |
|---|---|---|
| `backend/deploy-sharepoint.ps1` | PnP 7-step (install / connect / 2 lists / Stage col / upload HTML) | ✅ ready to run |
| `backend/sp-list-schema.md` | 3 lists schema spec | ✅ doc; 待 deploy |
| `flows/extraction-flow.md` | 4 cloud flows: Interview / Form / Publish / Overdue | ✅ design; 待 build |
| `flows/azure-openai-prompts.md` | 3 prompts: extract / PII check / form normalize | ✅ design; 待 PoC |
| `docs/interview-guide.md` | 6 IPO question prompts | ✅ ready |
| `docs/form-channel-spec.md` | Microsoft Forms field spec | ✅ ready; 待建 Forms |
| `DECISIONS.md` | 5 scoping locked + 5 carry-over pending | ⚠️ 5 待拍板 (5/23) |

### SSOT (separate repo)

| Asset | Path | Status |
|---|---|---|
| `ai-cases-ssot.xlsx` | `~/Projects/primax-ai-cases-data/` | ✅ 98 cases × 34 cols |
| `scripts/build_ssot.py` | rebuild Excel | ✅ |
| `scripts/excel_to_json.py` | Excel → cases.json | ✅ |
| `raw-extraction/INVENTORY.md` | 9-tier source inventory | ✅ |

---

## Part B — Critical gaps

Gaps blocking E2E deployment, ranked by impact:

### Gap 1 — Three schema versions don't align ⚠️ HIGH

| Schema | Where | Columns | Status |
|---|---|---|---|
| V5 case card | SSOT Excel | 34 (incl. Owner_Email/Quote/Build_Story/Category_Matrix/ECRS/...) | Glen's hand-crafted |
| SP List planned | `backend/sp-list-schema.md` | 19 (Title, BG, Stage, Tools, BenefitsSummary, PainPoint, 4×JSON, Status, Owner, Reviewer, EvidenceUrl, SourceChannel, SourceRef, Category, SubmittedDate, PublishedDate) | spec only |
| SP List existing | actual SP site | 13 (`OData__x75db__x9ede_` 痛點 / `OData__x516c__x53f8_` 公司 etc.) | half-Chinese OData-encoded |

**Resolution**: Pick **one** canonical schema. **Recommendation: rebuild SP List from scratch with all-English internal names**, then make SSOT Excel = source. The existing 半中文 SP List is technical debt that gets worse over time.

### Gap 2 — Stage vocabulary mismatch ⚠️ HIGH

| Source | Vocabulary |
|---|---|
| SSOT Excel | 55+ verbatim phrases ("MVP 完成、評估擴廠推廣" / "結案-未確認運維狀態" / "卡點—資料權限"...) |
| SP List schema | `Prototype / Development / Deploy` (3 values) |
| index.html filter | 6 buckets (已上線 / MVP / POC / 結案 / 規劃 / 卡點) |

**Resolution**: Adopt **dual columns**:
- `Stage_Raw` — verbatim (preserves source fidelity)
- `Stage_Norm` — normalized to {Prototype / Development / Deploy / Completed-Inactive / Planning}

Migration script does the mapping; SP List View filters on `Stage_Norm`.

### Gap 3 — V5 fields not in SP List spec ⚠️ MED

`sp-list-schema.md` 沒納入 V5 額外欄位：`Owner_Role / Owner_Background / Owner_Email / Owner_Photo / Build_Story / Quote / Category_Matrix / ECRS / Maturity_Indicator / Before_How / Before_Pain / After_How / After_Outcome`

**Resolution**: Extend SP List schema (+ 13 cols) and update `deploy-sharepoint.ps1` Step 5 to add them.

### Gap 4 — Frontend duplication ⚠️ MED

`index.html` (我重寫的) 跟 `hub-dynamic.html` 各自獨立發展，UI feature set 不對齊：

| Feature | index.html | hub-dynamic.html |
|---|---|---|
| Before/After 對比 | ✅ | ❌ |
| Owner card + Quote | ✅ | ❌ |
| Build Story | ✅ | ❌ |
| Like/Comment | ✅ (localStorage mock) | ❌ (SP native dependency) |
| SP REST live binding | ❌ (cases.json static) | ✅ |
| Stage pipeline visualization | ❌ | ✅ |
| Prompts list | ❌ | ✅ |
| Events timeline | ❌ | ✅ |

**Resolution**: Merge into single `index.html` that:
- UI: keep index.html's Before/After + Owner + Quote
- Data: switch to hub-dynamic's SP REST fetcher
- Like/Comment: replace localStorage with SP native (or REST API to Comments endpoint)
- Add Prompts/Events sections from hub-dynamic

### Gap 5 — Azure OpenAI provisioning blocker ⚠️ HIGH

`D-NEW-04` 要 Azure OpenAI。對接 `project_ms_ai_playbook B2` (Service Principal blocker)。**no Azure OpenAI = no auto-extraction**.

**Resolution paths**:
- **Short-term** (Phase 1, no IT dependency): manual extraction by Glen + paste into Forms / SP List directly
- **Long-term** (Phase 3): Glen 發 IT ticket, request Azure OpenAI tenant (TW region for PIPL) + Service Principal + Power Automate Premium

### Gap 6 — D-C4-1~5 carry-over decisions ⚠️ HIGH (deadline 5/23)

Still pending:
- D-C4-1: Forms 載體 final (recommended Microsoft Forms + flow)
- D-C4-2: 送件 = 上架前置 (recommended 強制)
- D-C4-3: EvidenceUrl required in Published state
- D-C4-4: 審核流程 (Glen-only vs ambassador-tier)
- D-C4-5: Baseline metadata 補齊責任

**Resolution**: Lock these 5 by 5/23 before flow build.

### Gap 7 — Service Account (D-NEW-02 enforcement)

D-NEW-02 = only DTO can write SP List. 非 DTO 走 Forms → Flow → SP. Flow needs service account.

**Resolution**: 對齊 `project_ms_ai_playbook B2`. IT ticket: Entra App Registration with `Sites.Manage.All` / `Lists.ReadWrite`. May get blocked by IT policy.

### Gap 8 — Migration script missing

No script exists to push SSOT Excel → SP List. Currently:
- Excel → cases.json: ✅ (`excel_to_json.py`)
- cases.json → SP List: ❌

**Resolution**: Write `scripts/excel_to_splist.py` (uses PnP PowerShell or SP REST API via `msal` Python lib + Service Account).

### Gap 9 — SP site/list existence unverified

Plan assumes `https://primaxgroup.sharepoint.com/sites/DTO-Office/` exists with `AI案例庫` list. **Not personally verified by Glen yet**.

**Resolution**: First action — login to SP, confirm site + list, screenshot for record.

### Gap 10 — PnP ClientId likely blocked

`deploy-sharepoint.ps1` uses PnP Management Shell official ClientId `31359c7f-bd7e-475c-86db-fdb8c937548e`. **Primax IT may have blocked this** (common policy).

**Resolution**: If blocked, IT registers internal Entra App, swap ClientId in script.

### Gap 11 — Like/Comment in non-SP context

SP-native Likes/Comments only work in SP-hosted page. iframe-embedded `index.html` might not get session token → cant call Comments API.

**Resolution**: Either deploy as SP Web Part (not iframe), or accept localStorage mock for non-SP previews.

### Gap 12 — Multi-channel transcription not wired

`docs/spec.md` mentions own-voice-get + Groq fallback for Channel 1. But Power Automate cloud flow can't run faster-whisper. Options: Azure Speech-to-Text (cloud cost) or PA Desktop (per-machine) or pre-transcribe manually.

**Resolution**: Phase 1 = manual transcription by Glen (own-voice-get on his machine), Phase 3 = Azure Speech-to-Text.

---

## Part C — Critical path & dependencies

```
                   ┌── (1) Verify SP site + list exists ─────────┐
                   │                                              │
                   ├── (2) Lock D-C4-1~5 (5/23)                  │
                   │                                              │
                   ├── (3) IT tickets: Entra App + Azure OpenAI ─┼─→ blocks Phase 3
                   │                                              │
[NOW] ─────────────┤                                              │
                   ├── (4) Schema unification (V5 vs SP)         │
                   │                                              │
                   ├── (5) Migrate Excel → SP List               │
                   │                                              │
                   ├── (6) Wire hub-dynamic.html to merged schema│
                   │                                              │
                   └── (7) Build Forms + flow PoC ───────────────┘

Phase 1 (no IT) ─→ Phase 2 (SP read live) ─→ Phase 3 (auto extraction)
   2 weeks            2 weeks                    6+ weeks (IT-gated)
```

---

## Part D — 3-Phase rollout

### Phase 1 — Schema unification + manual upload (Week 1-2)

**Goal**: SP List 上有真實資料，全集團可讀。**不需要 IT 協助**。

**Tasks**:
1. **Verify SP** (Day 1, 30 min): Glen 親自登入 `https://primaxgroup.sharepoint.com/sites/DTO-Office/`, 截圖 `AI案例庫` 既有狀態
2. **Lock D-C4-1~5** (Day 2-3, before 5/23): Glen 拍板，更新 `DECISIONS.md`
3. **Extend SP List schema** (Day 3-4):
   - 修改 `backend/sp-list-schema.md` 加 13 個 V5 欄位
   - 修改 `deploy-sharepoint.ps1` Step 5 加對應 `Add-PnPField`
   - 加 `Stage_Raw` + `Stage_Norm` 雙軸
4. **Run deploy script** (Day 5):
   - PowerShell 7 跑 `deploy-sharepoint.ps1`
   - 若 ClientId 被擋 → IT ticket (Gap 10)
   - 驗證 `AI_Prompts` + `AI_Events` 建立、`AI案例庫` 新欄位生效、`hub-dynamic.html` 上傳
5. **Write migration script** (Day 6-7):
   - `scripts/excel_to_splist.py` 用 PnP PowerShell (already authenticated) or `msal` + Service Account
   - Dry-run with 1 case → check schema mapping
   - Full migration 98 cases (set `Status=Draft` for all initially)
6. **Manual lifecycle promotion** (Day 8-9):
   - Glen 在 SP List 把 31 個 Active-Internal 案改成 `Status=In Review`
   - Glen + Vicky review → `Status=Published`
7. **Enable Comments + Likes** (Day 10):
   - List settings → Allow comments / Rating settings = Likes
8. **Configure 6 Views** (Day 10):
   - Published default / Draft Queue / In Review / By BG / By Category / Recent

**Phase 1 Exit Criteria**:
- ✅ SP List 含 98 cases, ~30 published
- ✅ 全集團 read 權限 working
- ✅ Comments + Likes 啟用
- ✅ 6 Views all working

---

### Phase 2 — Frontend SP-connected + multi-channel write (Week 3-4)

**Goal**: 員工從內網開 hub URL 看到實時 SP 資料 + 透過 Forms 送件。

**Tasks**:
1. **Merge frontend** (Day 1-3):
   - 把 `index.html` 的 Before/After + Owner card + Quote + Build Story 移植到 `hub-dynamic.html`
   - Remove localStorage mock, use SP native Comments + Likes endpoints
   - Update schema mapping (V5 cols ↔ SP cols)
2. **SP deployment** (Day 4):
   - `deploy-sharepoint.ps1` Step 6 重跑（會 overwrite `hub-dynamic.html`）
   - Test URL `<site>/SiteAssets/hub-dynamic.html` 直開
3. **Modern Page embed** (Day 5):
   - DTO-Office site 建 Modern Page "AI Cases"
   - Embed Web Part → 嵌 hub-dynamic.html (iframe)
   - Verify Like/Comment 在 SP context 內可用
4. **Microsoft Forms 建表** (Day 6-7):
   - 依 `docs/form-channel-spec.md` 建 Forms
   - 13 欄位（含 D-C4-3 conditional EvidenceUrl）
5. **Build Flow 2 (Forms → SP)** (Day 8-9):
   - Power Automate cloud flow (no Azure OpenAI yet — skip AI normalize step)
   - Forms trigger → SP REST POST item with `Status=Draft`, `SourceChannel=Form`
   - Teams notify DTO channel
   - **Test**: submit 3 dummy forms → 確認 3 items 進 SP List
6. **DTO review SOP** (Day 10):
   - 文件 Draft → Review → Published workflow
   - Glen + Vicky weekly clean Draft queue

**Phase 2 Exit Criteria**:
- ✅ SP-hosted hub-dynamic.html 員工從內網可開
- ✅ Forms submit → SP List Draft 自動寫入
- ✅ Like + Comment SP native 互動可用
- ✅ DTO Draft queue 流程跑通

---

### Phase 3 — AI extraction automation (Week 5+, IT-gated)

**Goal**: 訪談錄音/文字 → 自動萃取 → 進 Draft。**需要 IT 配合**。

**IT dependencies (blocking)**:
- ⚠️ Azure OpenAI resource (TW region)
- ⚠️ Service Principal / Entra App with `Sites.ReadWrite.All`
- ⚠️ Power Automate Premium license for DTO team
- ⚠️ Azure Speech-to-Text resource (if going cloud transcription)

**Tasks** (timeline depends on IT response, 6-12 週):

1. **IT alignment meeting** (Week 5 Day 1): Glen + Weiwu align IT on:
   - Azure OpenAI tenant provisioning
   - PIPL compliance (region = Taiwan, not China/US)
   - Service Account scope
2. **Wait for IT provisioning** (Week 5-7):
   - Azure resources created
   - Glen 拿到 API key + endpoint
3. **Build Flow 1 (Interview extraction)** (Week 8):
   - 依 `flows/extraction-flow.md` Flow 1
   - HTTP action → Azure OpenAI
   - 用 `flows/azure-openai-prompts.md` Prompt 1
   - Eval plan: 10 baseline cases, target 85% field accuracy + 100% PII recall
4. **Build Flow 3 + 4** (Week 9):
   - Publish notification flow
   - Overdue Draft alert
5. **Production cutover** (Week 10):
   - DTO 內網廣播
   - BG ambassadors 認領 baseline metadata 補齊（D-C4-5）
   - Weekly DTO review cadence

**Phase 3 Exit Criteria**:
- ✅ Interview m4a → AI 萃取 → SP Draft 自動
- ✅ PII redaction 100% recall
- ✅ Eval 通過 85% 欄位準確
- ✅ Full lifecycle: interview → extract → review → publish → BG notify

---

## Part E — Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IT blocks Azure OpenAI provisioning | HIGH | HIGH (kills Phase 3) | Pre-meet IT, prep compliance argument; fallback = manual extraction in Phase 1-2 |
| PnP ClientId blocked | MED | LOW | IT ticket to register internal Entra App |
| D-C4-1~5 not locked by 5/23 | MED | MED | Glen send email reminder, force decision in this week's check-in |
| Forms premium license missing | MED | HIGH (Phase 2 stop) | Check DTO team license tier, request Premium if needed |
| Migration script breaks on schema mismatch | MED | MED | Dry-run with 1 case first; spot-check 5 random rows in SP |
| Vicky pushes back on lifecycle gates | LOW | MED | Show D-NEW-01 (集團可見) + EvidenceUrl 必填 是品質保證的核心 |
| Owner 訪談排不上 | HIGH | LOW (only affects Build_Story/Quote) | Build_Story 可後補；不擋 Published |
| SP List 既有 13 欄半中文 schema 不想砍 | MED | HIGH (Gap 1 解決方案的關鍵) | If Glen 想保留 → 在 hub-dynamic 改 schema mapping; if 願意砍 → 重建乾淨 schema |

---

## Part F — Decisions you need to make now

Before starting Phase 1, lock these:

| # | Decision | Options | My recommendation |
|---|---|---|---|
| DP-1 | Schema unification path | (a) 砍既有 SP List 重建乾淨 / (b) 在 hub-dynamic.html 寫 schema mapper 對接既有 13 半中文欄位 | **(a) 砍重建**，技術債不要扛 |
| DP-2 | Stage_Norm 控制詞彙 | (a) 3 種 Prototype/Dev/Deploy / (b) 5 種加 Completed-Inactive + Planning | **(b) 5 種**，55+ verbatim 才壓得進去 |
| DP-3 | Phase 1 是否手動 publish | (a) Glen 全手動 30 案 (~2 hr work) / (b) script 批次 set Active-Internal → Published | **(a) 手動**，第一輪逐案 review 是品質紀律 |
| DP-4 | Service Account 來源 | (a) 申請新 service account / (b) 用 Glen 個人 service principal | **(a) 新 SA**，Glen 離職後流程不會斷 |
| DP-5 | Frontend 合併方向 | (a) `index.html` 主幹補 SP / (b) `hub-dynamic.html` 主幹補 V5 UI | **(b) hub-dynamic 主幹**，因 SP 連線邏輯已完整，UI 補上比資料層補上容易 |
| DP-6 | Transcription path Phase 1-2 | (a) own-voice-get manual / (b) 沒訪談就先不收 | **(a)**，已有工具，不卡 |
| DP-7 | Phase 1 vs Phase 2 並行 | (a) 序列 / (b) Phase 1 完成 50% 即啟動 Phase 2 | **(b) 並行**，Phase 2 不需要 IT，可同步進行 |

---

## Part G — Quick wins (do this week)

不等任何 IT 就能做的事：

1. **登入 SP 確認既有狀態** (30 min)
2. **拍板 D-C4-1~5** (1 hr review + ask Vicky)
3. **拍板 DP-1~7** (30 min review)
4. **更新 sp-list-schema.md 加 V5 欄位** (1 hr)
5. **修改 deploy-sharepoint.ps1 加新欄位** (2 hr)
6. **寫 excel_to_splist.py 草稿** (3 hr)
7. **準備 IT ticket draft for Azure OpenAI + Service Account** (1 hr)

Total: ~9 hours, 可在 2-3 個工作天完成。

---

## Part H — Open questions

- [ ] DTO-Office SP site 是否實際存在？（spec assumes yes，但未由 Glen 親自驗證）
- [ ] AI案例庫 既有 13 欄半中文 schema 內已有多少筆？是否要保留歷史資料？
- [ ] Vicky 是否同意「全集團可見」對 customer-sensitive RFQ 案例（如 iIBG RFQ 90~95% 自動對應）的揭露程度？
- [ ] BG ambassador 是誰？（影響 D-C4-4 + D-C4-5）
- [ ] Power Automate Premium license 是否已有？沒有 → HTTP connector 無法用 → Azure OpenAI 整合走不通
