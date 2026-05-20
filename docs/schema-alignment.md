# Schema Alignment (Gap 1 + Gap 2 resolution)

> **Locked**: 2026-05-19 by Glen (DP-1, see DECISIONS.md)
> **Canonical**: V5 38 cols (V5 SSOT 34 + 4 SP-only adopted)
> **Replaces**: SP existing 13 半中文 schema (deprecated), SP spec 19 (extended to 38)

---

## 1. Why three schemas existed

| Schema | Created when | Created by | Purpose |
|---|---|---|---|
| **V5 (34 cols)** | 2026-04-05 ~ 2026-05-05 v5-case-card-pptx-rebuild | Glen 親手 | 案例卡 PPTX SSOT，含完整 IPO + 痛點 + 來源 + email + 最後確認日期 + 分類矩陣 + ECRS + 燈號 |
| **SP spec (19 cols)** | 2026-05-19 morning | Glen (knowledge-hub session) | 規劃 SP List 新建版本，定治理欄位 (Status / Reviewer / EvidenceUrl / SourceChannel) |
| **SP existing (13 half-Chinese)** | unknown date, 既有歷史 | Primax 內部之前的 SP list 設定 | 半中文編碼欄名 (`OData__x75db__x9ede_` = 痛點)，hub-dynamic.html mapping 過去 |

三套各自發展，**沒人做過 reconciliation**，直到 2026-05-19 deployment plan 對齊。

---

## 2. Canonical 38-col composition

```
V5 base 34 cols (Glen 親手定義)
├─ Identity & summary (6)
│   ├─ ID, BG, Title, Tools, Benefits_Summary, Stage
├─ Problem & Before/After narrative (5)
│   ├─ Pain_Point, Before_How, Before_Pain, After_How, After_Outcome
├─ IPO engineering view (4)
│   ├─ Input, Process, Output, Benefits
├─ Story & owner (7)
│   ├─ Build_Story, Owner_Name, Owner_Role, Owner_Dept,
│   ├─ Owner_Background, Owner_Photo, Owner_Email, Quote  ← 7
├─ V5 card alignment (3)
│   ├─ Category_Matrix, ECRS, Maturity_Indicator
├─ Provenance (4)
│   ├─ Source_Meeting, Verification_Status, Last_Updated, Updated_By
└─ Lifecycle (Publish_Status axis) (4)
    ├─ Publish_Status, Publish_Date, Archive_Date, Archive_Reason

+ Gap 2 resolution (1 new col)
└─ Stage_Norm (Choice: Deploy/Development/Prototype/Planning/Stalled/Other)

+ SP-only adopted (3 from SP spec)
├─ Reviewer (Person)
├─ EvidenceUrl (URL, conditional required when Active-Published)
└─ SourceChannel (Choice: Interview/Form/Migrated)

= 38 cols total
```

---

## 3. Full mapping table

### V5 (canonical) → SP spec → SP existing (deprecated)

| # | V5 col | SP spec equivalent | SP existing (deprecated) | Mapping rule |
|---|---|---|---|---|
| 1 | ID | (none, derived from Title slug) | (none) | URL slug — primary key |
| 2 | BG | BG | BusinessUnit | Direct |
| 3 | Title | Title | Title | Direct (SP built-in field) |
| 4 | Tools | Tools | (none — was part of Insight free text) | Direct |
| 5 | Benefits_Summary | BenefitsSummary | Summary | Rename: V5 underscore → SP camelCase |
| 6 | Stage (verbatim) | Stage (3-enum) | Stage | **Stage spec 原本只允 3 enum，現改 verbatim Text** |
| 7 | **Stage_Norm** (NEW) | (none) | (none) | **Gap 2 resolution: 5-bucket Choice** |
| 8 | Pain_Point | PainPoint | `OData__x75db__x9ede_` | Decode 半中文，rename |
| 9 | Before_How | (none) | (none) | **V5 故事欄補入 SP** |
| 10 | Before_Pain | (none) | (none) | 同上 |
| 11 | After_How | (none) | (none) | 同上 |
| 12 | After_Outcome | (none) | (none) | 同上 |
| 13 | Input | InputJSON | InputData | Rename, format: \n-list → JSON array |
| 14 | Process | ProcessJSON | ProcessSteps | 同上 |
| 15 | Output | OutputJSON | OutputResult | 同上 |
| 16 | Benefits | BenefitsJSON | BenefitNote | 同上 |
| 17 | Build_Story | (none) | (none) | V5 故事欄補入 SP |
| 18 | Owner_Name | Owner (Person) | (none) | V5 用 Text，SP 可選用 Person 型 |
| 19 | Owner_Role | (none) | (none) | V5 補入 SP |
| 20 | Owner_Dept | (Owner Person.Department) | (none) | 從 Owner Person 自動解析 |
| 21 | Owner_Background | (none) | (none) | V5 補入 SP |
| 22 | Owner_Photo | (none) | (none) | V5 補入 SP (optional) |
| 23 | Owner_Email | (Owner Person.Email) | (none) | 從 Owner Person 自動解析 |
| 24 | Quote | (none) | (none) | V5 補入 SP |
| 25 | Category_Matrix | Category (10 類 Empowerment) | AI_Type | **定義不同** — V5 是 個人/組織×AI/RPA, SP spec 是 10 類; SP existing 是 AI Type — Glen 重新定 canonical = V5 矩陣 |
| 26 | ECRS | (none) | (none) | V5 補入 SP |
| 27 | Maturity_Indicator | (none) | (none) | V5 補入 SP |
| 28 | **Reviewer** | Reviewer | (none) | **SP spec → V5 採納** |
| 29 | **EvidenceUrl** | EvidenceUrl | (none) | **SP spec → V5 採納 (D-C4-3)** |
| 30 | **SourceChannel** | SourceChannel | (none) | **SP spec → V5 採納** |
| 31 | Source_Meeting | SourceRef | SourceNote | Rename |
| 32 | Verification_Status | (none) | (none) | V5 補入 SP |
| 33 | Last_Updated | SubmittedDate | (none) | Rename — SP 用內建 Modified field |
| 34 | Updated_By | (Modified By auto) | (none) | SP 用內建 Editor |
| 35 | Publish_Status | Status (3 enum) | (none) | **enum 擴充**: SP spec 3 (Draft/In Review/Published) → V5 4 (Draft/Active-Internal/Active-Published/Archived) |
| 36 | Publish_Date | PublishedDate | (none) | Rename |
| 37 | Archive_Date | (none) | (none) | V5 lifecycle 補入 SP |
| 38 | Archive_Reason | (none) | (none) | 同上 |

### Dropped from SP existing (8 cols 棄用)

| SP existing | 棄用理由 |
|---|---|
| `OData__x75db__x9ede_` (痛點 編碼) | OData URL-encoded 欄名 debug 困難，且重複功能 → 用 `PainPoint` |
| `OData__x516c__x53f8_` (公司 編碼) | 同上；公司資訊可從 BG 推導，不用獨立欄 |
| `Insight` | 無對應 canonical 欄；資料 ad-hoc 觀察，遷移時可拼進 Build_Story |
| `AI_Type` | Concept 跟 Category_Matrix 重疊，但定義不同 → 用 V5 Category_Matrix |
| `BenefitNote` (rename to BenefitsJSON) | rename 不算 drop |

---

## 4. Stage normalization (Gap 2)

### Bucket definitions

| Bucket | Acceptance criteria | 出現範例 |
|---|---|---|
| **Deploy** | 案例已 production，固定運行 | 已上線 / 穩定運行 / Deployment / Expanding (擴張中也算) |
| **Development** | MVP 完成、進行中、Q2 開發、即將上線 | MVP 完成 / Kickoff / 2026-05 啟動 / 報表完成 |
| **Prototype** | POC / 評估 / 測試 / 個人試用 (非組織級) | POC 階段 / 測試中 / 個人運行 / Phase 1 / 雙軌規劃 |
| **Planning** | 提案、需求、未啟動實作 | 需求 / 提案規劃 / Phase 0 / 待 X 決策 |
| **Stalled** | 卡點、On Hold、結案無持續、退役 | 結案-未確認運維狀態 / 卡點 / On Hold / POC 結束 |
| **Other** | 兜底，未來新加 verbatim 落在現有 5 桶外 | (目前 0) |

### Full 58-verbatim → 5-bucket map

Single source of truth: `~/Projects/primax-ai-cases-data/scripts/build_ssot.py::STAGE_NORM_MAP`

98 cases 分布：
- Deploy: 35
- Development: 11
- Prototype: 21
- Planning: 20
- Stalled: 11

### Dual-axis usage

| Axis | When to use |
|---|---|
| `Stage` (verbatim) | DTO 內部維護、Owner 看到的版本（保留原文情境，如「MVP 完成/2026-06 完工」「卡點—資料權限」）|
| `Stage_Norm` (5 enum) | SP List View filter、前端 filter chip、報表彙總、Slide 8 統計 |

### Edge cases Glen 拍板

| Verbatim | My assignment | Why |
|---|---|---|
| `Expanding (X5 已上線, 58 台部署計畫)` | Deploy | 主體已上線，58 台是延伸 |
| `MVP 完成/已上線` | Development | 「MVP」字眼主導 (4M1E case) |
| `個人運行` | Prototype | 非組織級部署 |
| `POC 結束（使用率低、平台限制多）` | Stalled | 已結束 + 使用率低 = 實質退役 |
| `5/7 分享 Session` | Prototype | 內部分享 ≠ production |
| `5/9 Sync 報告納入` | Planning | 政策草擬期 |

---

## 5. Impact assessment

### Affected files

| File | Change | Status |
|---|---|---|
| `~/Projects/primax-ai-cases-data/scripts/build_ssot.py` | +5 cols (Stage_Norm + Reviewer + EvidenceUrl + SourceChannel; 加 STAGE_NORM_MAP) | ✅ Done |
| `~/Projects/primax-ai-cases-data/ai-cases-ssot.xlsx` | 34→38 cols, 98 rows rebuilt with Stage_Norm | ✅ Done |
| `~/Projects/primax-ai-cases-data/scripts/excel_to_json.py` | 自動跟著 schema (WEB_FIELDS 用 dynamic header parsing) | ⚠️ Need recheck — see Section 7 |
| `~/Projects/primax-ai-cases/cases.json` | regenerated from new Excel | ✅ Done |
| `~/Projects/primax-ai-cases/backend/sp-list-schema.md` | 完全改寫 → canonical v2 | ✅ Done |
| `~/Projects/primax-ai-cases/backend/deploy-sharepoint.ps1` | Step 5 from 1 field → 32 fields | ✅ Done |
| `~/Projects/primax-ai-cases/DECISIONS.md` | +DP-1 entry | ✅ Done |
| `~/Projects/primax-ai-cases/index.html` | 仍能 fetch cases.json + render，新欄位 stage_norm 可選用 | ⚠️ Need recheck — see Section 7 |
| `~/Projects/primax-ai-cases/hub-dynamic.html` | SP REST mapping 還是舊半中文欄名 | ❌ Need rewrite (Phase 2 task) |

### Cross-repo data flow

```
SSOT Excel (V5 38)        excel_to_json.py        cases.json (V5 38)
~/...-data/               ────────────────→       ~/...-cases/
   ↓ rebuild                                       ↓ fetch
                                                  index.html (V5 schema, working)

   ↓ migration (Phase 1, 待 excel_to_splist.py)

SP List AICases_v2 (38)   ←────────────────       (One-way: Excel is master in Phase 1)
   ↓ direct fetch
hub-dynamic.html (needs rewrite to V5 schema, Phase 2)
```

---

## 6. Migration to SP — 3 options recap

依 `backend/sp-list-schema.md` Section "Migration from existing list":

| Option | 動作 | 風險 | 建議 |
|---|---|---|---|
| **A. Hard cutover** | 砍既有 `AI案例庫`，新建 `AICases_v2`，SSOT 重灌 | 既有 SP 手動編輯資料丟失 | 若既有 list 是空殼 → A |
| **B. Parallel & sunset** | 保留 `AI案例庫` 唯讀，新建 `AICases_v2` 為主；3 個月後砍舊 | 雙重 list 期間需引導 | ✅ Default 推薦 |
| **C. In-place** | 既有 list 加 25 個新英文欄；半中文欄人工搬資料後棄 | OData 編碼欄永久殘留 | 不推薦 |

---

## 7. Open follow-ups (待處理)

### Immediate

1. ⚠️ Verify `excel_to_json.py` WEB_FIELDS 是否包含 `Stage_Norm / Reviewer / EvidenceUrl / SourceChannel`（讓前端看得到 normalized stage）
2. ⚠️ Verify `index.html` Tier 1 filter 改用 `stage_norm` 而非 `stageBucket(stage)` 動態算（消除 dual mapping）
3. ⚠️ Write `scripts/excel_to_splist.py` for Phase 1 migration (Excel → SP REST POST batch)

### Phase 1 cutover

4. Verify SP site `https://primaxgroup.sharepoint.com/sites/DTO-Office/` 存在
5. Confirm `AICases_v2` 是新建還是 rename 既有 list
6. 跑 `deploy-sharepoint.ps1` 建 list + 32 欄
7. 啟用 List Comments + Likes (D-NEW-05)
8. 設 6 個 Views
9. 跑 `excel_to_splist.py` 灌 98 cases
10. Glen 在 SP UI review 31 個 Active-Internal → 升級成 Active-Published

### Phase 2 cutover (frontend)

11. `hub-dynamic.html` 改 schema mapping 從 `OData__x75db__x9ede_` → `PainPoint` 等 (32 個 field rename)
12. `hub-dynamic.html` 合併 `index.html` 的 Before/After + Owner card + Quote + Build Story UI
13. 取消 localStorage mock，改 SP native Comments + Likes endpoint
14. 部署到 SP SiteAssets
15. Modern Page Embed Web Part

---

## 8. Backward compatibility

`index.html` 既有 demo（fetch cases.json）**仍正常運作**：
- `stage` field 仍存在（verbatim）
- `stage_norm` 是新加 field，舊 frontend ignore
- 31 Active-Internal cases 全部仍可看
- Before/After / Owner / Quote / Build Story 區塊不受影響

無 breaking change。Glen 隨時可重開 demo 確認。

---

## 9. References

- `DECISIONS.md` DP-1 (canonical schema lock)
- `DECISIONS.md` D-NEW-05 (comments + likes)
- `DECISIONS.md` D-C4-3 (EvidenceUrl conditional required)
- `backend/sp-list-schema.md` (full canonical SP schema spec)
- `~/Projects/primax-ai-cases-data/scripts/build_ssot.py::STAGE_NORM_MAP` (Stage SoT)
- `docs/deployment-plan.md` (E2E rollout, 3 phases)
