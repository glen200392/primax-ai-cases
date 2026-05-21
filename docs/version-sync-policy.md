# primax-ai-cases · Version Sync Policy

> 何時把某條 mirror 路徑的 brand line / wording 同步到最新版的決策框架。
> 建立 2026-05-21，after「AI × 流程自動化案例集」rename 引起的 over-sync 反思。
> Cross-project principle 在 `~/.claude/memory/feedback_trigger_based_brand_sync.md`。

---

## 為什麼需要這個 policy

`primax-ai-cases` repo 內有 7+ 個 mirror 路徑，各自服務不同部署目標 / 生命週期階段。
每次 portal 主標題 / 副標題 / brand line 變動時，**不是所有 mirror 都該立刻同步**。

盲目 always-sync 會：
- spike 中的版本被無謂同步 → 下次大改時 churn
- legacy 版本被無謂同步 → noise commit
- research snapshot 被同步 → 破壞 time provenance
- spike 中途 commit brand sync → 鎖死進行中狀態

---

## 路徑盤點 + 同步觸發條件

| 路徑 | 用途 | 同步觸發條件 |
|---|---|---|
| `v3/` | LIVE GitHub Pages（員工會看） | **永遠立刻同步 + commit + push** |
| `v2/` | repo legacy（root 已 redirect 切走） | **永不同步**（無人訪問） |
| `sp-deploy/v2/` | SP Path A iframe deploy target | SP 端拍板走 Path A 才同步 |
| `sp-deploy/copilot-prompts.md` | SP Path B Copilot Native rebuild prompt | SP 端拍板走 Path B 才重寫 |
| `sharepoint-spfx-deploy/source-v3/` | SP Path C SPFx 靜態 mirror | SPFx spike 設計凍結後同步 |
| `sharepoint-spfx-deploy/spfx-solution/.../PrimaxAiCases.tsx` | SPFx React component | 同上 |
| `sharepoint-spfx-deploy/spfx-solution/.../PrimaxAiCases.module.scss` | SPFx CSS module（governance banner 等樣式） | 同上 + 部署前 |
| `docs/sharepoint-v3-implementation-runbook.zh-TW.md` | SP Path A 部署 SOP | Path A 被選定後 |
| `docs/sharepoint-v3-native-to-spfx-implementation-plan.md` | SPFx 遷移計畫 SOP | Path B 或 C 被選定後 |
| `docs/spfx-full-implementation-runbook.zh-TW.md` | SPFx 部署 runbook | SPFx spike 凍結後 |
| `docs/marketing-uiux-playbook.md` | research snapshot（含舊版引用） | **永不同步**（保留 time provenance） |

---

## Commit 目的決策矩陣

不同版本 commit 的目的不同——**不是「改了就 commit」**：

| commit 對象 | 目的 | 何時該 commit |
|---|---|---|
| LIVE (v3/) | 觸發 Pages deploy + 歷史紀錄 | 改完即 commit + push |
| SPFx spike | checkpoint 防 work loss + 階段性 snapshot | 設計凍結 / milestone 完成時，**不要為了 brand 同步而 commit** |
| Legacy / 棄用 | 0 目的 | 永遠不 commit |
| Docs / runbook | 知識落地，未來查得到 | 對應 Path 被選定後一次性整理 |

---

## 本次 rename 範例（2026-05-21 「人機協作 → AI × 流程自動化案例集」）

| 路徑 | 處理 | Commit |
|---|---|---|
| `v3/` 5 檔 | ✅ 立刻 sync | `5d75eed` rename + `07f80ed` governance banner，已 push |
| `sharepoint-spfx-deploy/` 13 處 | 🟡 改 working tree | **不 commit**，等 SPFx 凍結 |
| `sp-deploy/` / `docs/sharepoint-*` | ⏸ 不動 | 等 SP 端拍板路徑 |
| `v2/` | ❌ 不動 | legacy |
| `docs/marketing-uiux-playbook.md` | ❌ 不動 | research snapshot |

---

## 何時更新到最新版的明確 trigger

```
觸發條件                                  → 對應 brand sync 動作
─────────────────────────────────────────────────────────
LIVE (v3/) 主副標變動                     → v3/ 立刻 sync + commit + push

SP 端拍板「走 Path A iframe」              → sp-deploy/v2/ + sp-deploy/copilot-prompts.md
SP 端拍板「走 Path B SP Native」          → sp-deploy/copilot-prompts.md 重寫
SP 端拍板「走 Path C SPFx」               → sharepoint-spfx-deploy/ 全 sync + CSS module + SCSS

SPFx spike 設計凍結（structure 穩定）     → SPFx brand 一次性對齊（5/28 deadline 前）

部署上線前                                → 對應 path 的 docs/runbook 一次同步

新版本進入維護期                          → 自動同步停止，只動 LIVE
```

---

## 例外條款（不適用 trigger）

**永遠不同步**的兩類，硬要同步反而失真：

1. **legacy 棄用版本** (`v2/`) — 沒有訪客、沒 redirect 進來，同步是 noise
2. **research / time-anchored docs** (`marketing-uiux-playbook.md`) — 引用「當時 LIVE」是合理 provenance，改了未來看會誤以為 research 對的是新版

---

## 附錄：跨 SP path 設計元素 portability matrix

C 版 hero redesign（meta 直排 + page-nav micro-anim + governance shadow + 字級放大）的設計元素，在 SP 各部署 path 下的可移植性：

| 設計元素 | A2 iframe → SP Site Assets | B SP Native rebuild | C SPFx custom web part |
|---|---|---|---|
| Grid 兩欄（governance 嵌右） | ✅ 100% keep | ⚠️ SP 兩欄 web part 可拼 | ✅ keep（React layout） |
| Hero 字級放大 (32/18) | ✅ keep | ❌ SP heading level 固定 | ✅ keep（SCSS module） |
| Meta 直排 + icon column | ✅ keep | ❌ SP 無對應 component | ✅ keep |
| Page-nav hover micro-anim | ✅ keep | ❌ SP nav 內建無法加 anim | ✅ keep |
| Governance shadow + inset border | ✅ keep | ⚠️ SP callout 樣式受限 | ✅ keep |
| Color tokens (warm orange) | ✅ keep | ⚠️ SP theme override，需 inline | ✅ SCSS variable |
| Responsive layout | ✅ iframe sandbox | ⚠️ 跟 SP grid 衝突 | ⚠️ SPFx container width 限制 |

### 結論

- **A2 iframe (SP Site Assets)**：C 版 100% 保留（iframe sandbox 獨立）
- **C SPFx**：C 版 100% 可重現（React + SCSS module）
- **B SP Native rebuild**：C 版多數元素 backfire — degrade 路徑見下方

### Path B Degradation Playbook（若未來真要走 B）

如果未來必須遷到 SP Native rebuild，C 版需要按以下順序 degrade：

1. **Meta 直排 → 退橫排** — SP 沒有 vertical list component，改用 inline list
2. **Page-nav hover anim → 移除** — SP nav 是內建 component，無法加 CSS transform
3. **Governance shadow → 退 simple border-only** — SP callout web part 的 shadow 受限
4. **字級放大 → 服從 SP heading level** — SP h1/h2/h3 字級固定，依 SP theme
5. **Grid 兩欄 → SP two-column web part 替代** — governance 移到右欄 callout web part
6. **Color tokens → inline color override** — SP theme override 主色，自定義色要 inline style

### 決策日期 + 選用 path

- **2026-05-21**：選 C 版本，目前同步到 GitHub Pages LIVE (`v3/`)
- **SP path 未拍板**：傾向 A2（sp-deploy bundle ready）或 SPFx（spike 中，5/28 deadline）
- **B 已棄**：5/21 milestone 寫明「失 ~30% v2 UX」trade-off note

---

## Maintainer

DTO Office (Glen + Vicky)。新 mirror 路徑加入時記得補到上面表格。
