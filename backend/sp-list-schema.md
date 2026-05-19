# SharePoint List Schema

> SP site: `https://primaxgroup.sharepoint.com/sites/DTO-Office`
> 3 lists total。`AI案例庫` 已存在，其他兩個由 `deploy-sharepoint.ps1` 建立。

---

## List 1: `AI案例庫` (existing — extend with new columns)

主案例 SSOT。已存在於 SP site，僅補欄位。

| Internal Name | Display | Type | Required | Notes |
|---|---|---|---|---|
| Title | 案例名稱 | Single line | ✓ | 對應 V5 IPO `title` |
| BG | 部門 / BG | Choice | ✓ | HR / IT / FA / RD / MFG / ESG / GEN |
| **Stage** | 階段 | Choice | ✓ | Prototype / Development / Deploy（由 `deploy-sharepoint.ps1` Step 5 加入） |
| Tools | 工具 | Single line | ✓ | 如 "Python + VBA" / "Copilot" / "Claude" |
| BenefitsSummary | 效益摘要（卡片底） | Single line | ✓ | 一句話，<60 字 |
| PainPoint | 痛點 | Multi-line | ✓ | Modal 第 1 段 |
| InputJSON | 資料來源 | Multi-line | ✓ | JSON array of strings |
| ProcessJSON | 處理流程 | Multi-line | ✓ | JSON array of strings |
| OutputJSON | 產出形式 | Multi-line | ✓ | JSON array of strings |
| BenefitsJSON | 完整效益 | Multi-line | ✓ | JSON array of strings |
| **Status** | 狀態 | Choice | ✓ | **NEW** — Draft / In Review / Published |
| **Owner** | 案例負責人 | Person | ✓ | **NEW** — DRI |
| **Reviewer** | 審核人 | Person | | **NEW** — DTO reviewer |
| **EvidenceUrl** | 證據連結 | URL | conditional | **NEW** — Status=Published 時必填（D-C4-3） |
| **SourceChannel** | 來源 channel | Choice | ✓ | **NEW** — Interview / Form / Migrated |
| **SourceRef** | 來源參考 | Single line | | **NEW** — 訪談檔名 / Forms response ID / baseline PPTX slide # |
| **Category** | 類別 | Choice multi | | **NEW** — AI Empowerment 10 類（Type 1×6 + Type 2×4）|
| **SubmittedDate** | 送件日 | DateTime | auto | **NEW** — system fill |
| **PublishedDate** | 發布日 | DateTime | | **NEW** — Status=Published 時 system fill |

**Views**：
| View 名 | Filter | 用途 |
|---|---|---|
| Published (default) | Status = Published | 對外展示 |
| Draft Queue | Status = Draft | DTO review queue |
| In Review | Status = In Review | 審核中 |
| By BG | Group by BG, sort by Stage | 部門總覽 |
| By Category | Group by Category | 跨部門能力分布 |
| Recent | Sort by PublishedDate desc | 最新發布 |

**Comments + Likes**：
- List settings → Advanced settings → "Allow comments" = Yes
- List settings → Rating settings → "Allow items in this list to be rated" = Yes → 選 "Likes"

---

## List 2: `AI_Prompts` (待建)

員工分享好用 Prompt。由 `deploy-sharepoint.ps1` Step 3 建立。

| Internal Name | Display | Type | Choices |
|---|---|---|---|
| Title | Prompt 標題 | Single line | — |
| Department | 部門 | Choice | HR / IT / FA / RD / MFG / ESG / GEN |
| UseCase | 應用情境 | Single line | — |
| PromptBody | Prompt 內容 | Note | — |
| Tools | 適用工具 | Single line | 如 "Copilot / ChatGPT" |
| Author | 作者 | Single line | — |

---

## List 3: `AI_Events` (待建)

DTO 辦的 AI 活動/分享會紀錄。由 `deploy-sharepoint.ps1` Step 4 建立。

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

## Service Account 寫入（for D-NEW-02）

非 DTO 員工不直接寫 List。改用：
1. Microsoft Forms 收件
2. Power Automate flow 觸發
3. Flow 以 service account 身分 `POST /_api/web/lists/getbytitle('AI案例庫')/items` 建立 `Status=Draft` 項目
4. DTO team 在 SP List 直接編輯 → `Status=Published`

Service account 申請：對齊 `project_ms_ai_playbook` B2 (Entra App Registration)。

---

## PnP ClientId

`31359c7f-bd7e-475c-86db-fdb8c937548e` (PnP Management Shell 官方)

若 IT 封鎖此 ClientId，需要 IT 註冊內部 Entra App（Sites.Manage.All / AllSites.Manage 權限）替換。
