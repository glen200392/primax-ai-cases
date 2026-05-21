# SP Deploy Bundle — Primax AI Cases Portal

> **Created**: 2026-05-21
> **Phase**: 0a-1（前端 SP-ready 完整建置）
> **Status**: Ready for SP Site Assets drag-drop deploy

這個資料夾是 **可以直接拖到 SharePoint 的 production bundle**，含整個 v2/ portal、cases.json、assets 圖檔，已移除密碼登入 gate。

---

## 1. 目錄結構

```
sp-deploy/
├── cases.json                ← 案例資料 SSOT export (98 cases × 41 cols web schema)
├── assets/
│   ├── home_hero_top.png     ← 首頁頂部 hero 圖
│   └── home_funnel.png       ← 首頁漏斗示意圖
└── v2/
    ├── home.html             ← 首頁 (PDD 漏斗 + sidebar entry chat)
    ├── cases.html            ← 案例集總覽
    ├── cases-prototype.html  ← Prototype 子頁
    ├── cases-development.html← Development 子頁
    ├── cases-deploy.html     ← Deploy 子頁
    ├── shared.css            ← 共用樣式
    └── shared.js             ← 共用邏輯 (fetch / filter / modal / chat)
```

**注意**：`v2/` 內**沒有** `auth-gate.js` 也沒有對它的 reference — 即無密碼 overlay，員工進 SP page 直接看到完整 portal。

---

## 2. 上傳步驟（drag-drop 3 步）

### Step 1: 登入 SP 並進 Site Assets

1. 開 https://tymcloud.sharepoint.com/sites/DTO/
2. Site contents → **Site Assets** library

### Step 2: 建 target folder

在 Site Assets 內建一個新 folder：

```
primax-ai-cases
```

### Step 3: Drag-drop 上傳

把本機 `sp-deploy/` 內以下 **三個項目** 直接拖到剛建的 `Site Assets/primax-ai-cases/`：

- `cases.json` (single file)
- `assets/` (整個 folder)
- `v2/` (整個 folder)

**不要** 拖 README.md 跟 iframe-snippet.html — 那是給你看的，不是給 SP 用的。

完成後 SP 上的結構應該是：

```
SP Site Assets/
└── primax-ai-cases/
    ├── cases.json
    ├── assets/
    │   ├── home_hero_top.png
    │   └── home_funnel.png
    └── v2/
        ├── home.html
        ├── cases.html
        ├── cases-prototype.html
        ├── cases-development.html
        ├── cases-deploy.html
        ├── shared.css
        └── shared.js
```

### Method B（若 drag-drop 失敗）：OneDrive 同步上傳

1. Site Assets library → 點 **"Sync"** → 同步到本機 OneDrive
2. 開本機 OneDrive 同步資料夾（路徑類似 `C:\Users\glen.ho\Tymphany\... - Site Assets`）
3. 在裡面建 `primax-ai-cases` folder
4. 把 `sp-deploy/` 內 cases.json + assets/ + v2/ 用 Windows Explorer 整個 copy 過去
5. OneDrive 自動同步上 SP

### Method C（PnP PowerShell）

之後 Phase 0a-2 之後可整合進 `backend/deploy-sharepoint.ps1` Step 6 自動化。

---

## 3. SP page iframe 嵌入

### Step 1: 開新 page 或既有 spike page

到 https://tymcloud.sharepoint.com/sites/DTO/SitePages/ → 新增或開既有 page

### Step 2: 加 Embed web part

Edit page → 點 `+` → 搜尋 "Embed" → 加進來

### Step 3: 貼 iframe code

打開本機 `sp-deploy/iframe-snippet.html`，把 `<iframe>` 整段 copy → 貼進 Embed 的 code box。完整 code：

```html
<iframe
  src="https://tymcloud.sharepoint.com/sites/DTO/SiteAssets/primax-ai-cases/v2/home.html"
  width="100%"
  height="2400px"
  frameborder="0"
  allowfullscreen
  title="Primax AI Cases Portal">
</iframe>
```

### Step 4: Apply → Save / Publish page

---

## 4. 預期行為

✅ 成功 = 下面這些都對：

- **無密碼 overlay 彈出**（auth-gate.js 已移）
- 首頁顯示 PDD 漏斗 + 3 個 stage counters（Prototype / Development / Deploy）
- 漏斗 counter 數字非 0（讀到 cases.json）
- Sidebar entry chat card 顯示在漏斗上方
- 點 Deploy 漏斗 → 切到 cases-deploy.html 子頁
- 點任一案例卡片 → IPO Modal 4 欄展開
- Modal 內 Owner card / Quote / Build_Story 顯示
- 中文字顯示為 Microsoft JhengHei / PingFang TC
- F12 Network: cases.json / 2 PNG / shared.css / shared.js 都 200
- F12 Console: 0 errors（**不應該有 auth-gate.js 404**）

---

## 5. 驗證 Checklist（O1-O15）

開 SP page preview 後對照以下 checklist 觀察（每項打勾或記錄）：

```
[ ] O1 載入: iframe 載入 v2/home.html, IT 不擋 Y/N
[ ] O2 cases.json: F12 Network status 200 Y/N
[ ] O3 assets PNG: home_hero_top.png + home_funnel.png 200 Y/N
[ ] O4 PDD 漏斗: 3 漏斗 counters 顯示什麼數字? _____ / _____ / _____
[ ] O5 切頁: 點 Deploy 漏斗 → cases-deploy.html 切過去 Y/N
[ ] O6 case modal:
    - 點案例卡 → modal 彈出 Y/N
    - modal 位置: 居中 / 偏移 / 被 SP top header 遮?
    - modal close (X) 按鈕 可點 Y/N
    - modal 內容超長時，iframe 內 scroll 還是 SP page scroll?
[ ] O7 sidebar chat card: 顯示 + click 行為 Y/N
[ ] O8 字型: 中文是 Microsoft JhengHei / PingFang TC 還是 fallback?
[ ] O9 mobile: SP mobile app 開 page, layout 如何?
[ ] O10 share link: 點 modal 內 share, URL 是 v2/ 還是 SP 路徑?
[ ] O11 F12 console errors: 數量 _____ 內容 _____
[ ] O12 SP permission inheritance: 換 test user 開, 看得到 Y/N
[ ] O13 iframe height: 2400px 夠 / 被截 / 太多空白
[ ] O14 SP nav overlap: top header / left nav 跟 iframe 內 sidebar 互相 overlap Y/N
[ ] O15 Refresh + back: 頁面 reload 後 state 保留 Y/N
```

填完 checklist 結果可決定下一步走哪個 Path（見 plan file `lucky-sprouting-gizmo.md` Phase B Decision Matrix）。

---

## 6. 已知限制（Phase 0a-1 minimal change 範圍內）

| Symptom | Root cause | Phase 0a-2 修法 |
|---|---|---|
| modal 可能被 SP top nav 遮 | iframe 內 fixed positioning 相對 iframe viewport | shared.css `.modal-backdrop` 加 `min-height: 100vh` + 改 absolute |
| Share link URL 是 SP iframe proxy 而非原 v2/ | `window.location.origin` 在 iframe 內被改寫 | shared.js `ix-share` handler 用 `document.referrer` fallback |
| cases.json 雙重 fetch (home.html L283 + shared.js L49) | F1 dedup 未做 | 合併 home.html inline script 到 shared.js |
| 沒有 Like / Comment 跨員工共享 | 用 localStorage，client-only | Phase 2 接 SP Comments / Likes REST |
| 案例資料是靜態 cases.json snapshot | 沒接 SP REST | Phase 0a-3 寫 SP REST adapter |
| auth-gate.js 在 GitHub Pages 版本仍有 | 沒對應 sp-deploy/ 機制做 conditional bypass | 本 plan 直接移除引用更乾淨 |

---

## 7. 回滾步驟

### 若 spike 失敗想完全清理 SP：

1. Site Assets → `primax-ai-cases` folder → 點 ... → Delete
2. Site Pages → 對應 spike page → Delete

### 若本機 sp-deploy/ 想重建：

```bash
rm -rf ~/Projects/primax-ai-cases/sp-deploy
# 然後重新從 plan 跑一次
```

原始 v2/ + cases.json + assets/ 從未被動過，重做不會丟資料。

---

## 8. 下一步

按驗證 O1-O15 結果分支：

- **多數 work（≥ 12/15 Pass）** → Phase 0a-2 patch F1/F3/F4 小修
- **modal 嚴重 break / mobile 不可用** → Path D Hybrid 重規劃
- **IT 跳警告 / permission 不繼承** → Path B SP Native 重做

詳見 `~/.claude/plans/lucky-sprouting-gizmo.md` Phase B Decision Matrix。

---

## 9. 檔案版本資訊

| File | Source | 改動 |
|---|---|---|
| cases.json | repo root 2026-05-19 build | none |
| assets/*.png | repo root | none |
| v2/shared.css | v2/shared.css | none |
| v2/shared.js | v2/shared.js | none |
| v2/home.html | v2/home.html (L174) | removed `<script src="auth-gate.js"></script>` |
| v2/cases.html | v2/cases.html (L8) | same |
| v2/cases-prototype.html | (L8) | same |
| v2/cases-development.html | (L8) | same |
| v2/cases-deploy.html | (L8) | same |

無其他改動。Phase 0a-1 minimal change 原則嚴格遵守。
