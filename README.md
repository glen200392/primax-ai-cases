# Primax AI Cases — Internal AI Use Case Portal

> **Status**: Active development (2026-05-19)
> **Owner**: DTO Office (Glen)
> **Visibility**: Private repo, GitHub Pages disabled (2026-05-19 lockdown)
> **Repo absorbed**: `knowledge-hub-prototype` (deploy script + dynamic hub variant 已併入)
> **Memory tracker**: `~/.claude/memory/project_primax_ai_cases.md`

## Scope

集團內網 AI 案例專區。整條管線：

```
[3 來源 channels]                    [SSOT]              [2-tier UI]
                                                          ┌──────────────┐
Channel 1: 訪談主動萃取  ─┐                              │ AI Home Page │
  (錄音/逐字稿/文字)      │                              │ (Card grid)  │
                          ├──→ Azure OpenAI 萃取  ──→   └──────┬───────┘
Channel 2: 員工自助送件  ─┤        + PII redaction              │ click
  (Microsoft Forms)       │             │                       ↓
                          │             ↓               ┌──────────────┐
Channel 3: Baseline 遷移 ─┘     SP List "AI案例庫"     │ Detail Modal │
  (既有 8 案例 + Slide 12)      (Draft → Review →     │ Title/Pain/  │
                                  Published)           │ IPO/Benefits │
                                                       │ +like/comment│
                                                       └──────────────┘
```

## 5 Confirmed Decisions (2026-05-19)

| # | Decision | 值 |
|---|---|---|
| D-NEW-01 | 可見範圍 | **全集團** (read) |
| D-NEW-02 | 寫入權限 | **只有 DTO** team (write) |
| D-NEW-03 | 訪談來源 | **不強制 Teams** — 錄音 / 紀錄 / 文件 / Forms 送件皆可 |
| D-NEW-04 | AI 萃取 | **Azure OpenAI** (內網部署 + 合規) |
| D-NEW-05 | 互動功能 | **評論 + 按讚** |

完整決策日誌見 [`DECISIONS.md`](DECISIONS.md)。

## Folder Structure

```
primax-ai-cases/
├── index.html              ← Tier 1+2 preview page (現改為從 cases.json 動態載入)
├── cases.json              ← 自 SSOT Excel 產生（不要手動編輯）
├── hub-dynamic.html        ← SP-connected full hub variant（從 knowledge-hub 併入）
├── style.css               ← shared styles（從 knowledge-hub 併入）
├── README.md               ← 本檔
├── DECISIONS.md            ← 5 confirmed + 5 A5 carry-over
├── backend/
│   ├── deploy-sharepoint.ps1   ← PnP PowerShell 部署腳本（從 knowledge-hub 併入）
│   └── sp-list-schema.md       ← SP List 欄位完整 spec
├── docs/
│   ├── spec.md                 ← 主規格（資料層 + 流程 + UI + 治理）
│   ├── interview-guide.md      ← 訪談提綱（V5 IPO 6 欄位 prompt）
│   └── form-channel-spec.md    ← A5 表單送件 channel spec（吸收 A5 memory）
└── flows/
    ├── extraction-flow.md      ← Power Automate cloud flow 設計
    └── azure-openai-prompts.md ← Azure OpenAI 萃取 prompt templates
```

## Data Pipeline (SSOT-driven, 2026-05-19 重連)

`index.html` 不再 hardcode 案例 — 改從 `cases.json` 動態 fetch。

```
SSOT Excel                              cases.json                  index.html
─────────                               ──────────                  ──────────
~/Projects/primax-ai-cases-data/
  ai-cases-ssot.xlsx       →  scripts/excel_to_json.py   →    fetch + render
  (98 cases × 34 cols)             --mode internal           (Tier 1 grid + Tier 2 modal)
```

### Modes
- `published` — 只放 `Publish_Status = Active-Published`（真正對外用）
- `internal` — Active-Internal + Active-Published（stakeholder preview，**目前模式**）
- `all` — 全部含 Draft / Archived（**absolutely never upload**）

### Regenerate cases.json after editing SSOT
```bash
cd ~/Projects/primax-ai-cases-data
python scripts/excel_to_json.py --mode internal --out ../primax-ai-cases/cases.json
cd ../primax-ai-cases
git add cases.json && git commit -m "data: refresh from SSOT" && git push
```

### Current snapshot
- Mode: `internal`
- Exported: 31 of 98 cases (Active-Internal; **0 Active-Published 因尚未經 Vicky review 升級**)
- Schema version: 1.0

## Live preview

- ~~GitHub Pages~~ — **已關閉 2026-05-19**（合規鎖定，含 Primax 內部資料）
- 本機 preview: `python -m http.server 8080` → http://localhost:8080
- SP deployment URL: `https://primaxgroup.sharepoint.com/sites/DTO-Office/SiteAssets/hub-dynamic.html`（待部署）

## Quick Start

### 看 preview（本機）
```bash
python -m http.server 8080
# open http://localhost:8080
```

### 部署到 SharePoint（首次）
```powershell
# PowerShell 7 (pwsh)，需 MFA 互動式登入
cd backend
.\deploy-sharepoint.ps1
```

## License

**All rights reserved.** Primax internal business information. No reuse, redistribution, or derivative works permitted.
