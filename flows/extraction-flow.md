# Power Automate Cloud Flow — Extraction Pipeline

> 3 條 channel 共用一個核心 flow，trigger 不同。
> 核心 spec；實際 flow JSON 部署後同步進 `flows/exported/` (gitignore)。

---

## Flow 1: Channel 1 — Interview Extraction

### Trigger
- **Connector**: SharePoint
- **Trigger**: "When a file is created in a folder"
- **Site**: DTO-Office
- **Folder**: `/Interviews-Inbox/`

### Steps

1. **Get file metadata + content**
   - 判斷 file extension
   - 若 audio (m4a/mp4/wav)：先呼叫 transcription
   - 若 docx：用 "Convert file" action → markdown
   - 若 pdf：OCR action
   - 若 md/txt：直接讀

2. **Transcription (if audio)**
   - **Option A** (preferred local): 不可行 — Power Automate cloud flow 不能跑 faster-whisper
   - **Option B**: Azure AI Speech-to-Text action（cloud，需 Azure resource）
   - **Option C**: 把檔案放 OneDrive，呼叫 own-voice-get 本機腳本（需 Power Automate Desktop）
   - **建議**: Option B for Phase 3 + 手動 transcribe (own-voice-get) for Phase 1

3. **Call Azure OpenAI**
   - **Action**: HTTP action (POST `https://<resource>.openai.azure.com/openai/deployments/<model>/chat/completions?api-version=2024-10-21`)
   - **Auth**: Managed Identity or API key (in Power Automate secure parameters)
   - **System prompt**: 見 `azure-openai-prompts.md` § 1
   - **User content**: 訪談逐字稿 / 文字內容
   - **Output**: JSON with 6 IPO fields + suggested Category + suggested Stage

4. **PII redaction**
   - **Sub-flow**: 對所有 string fields 跑 regex blacklist
   - **Regex patterns**: 員工 ID、身分證、電話、薪資數字
   - **LLM secondary check**: 再呼叫 Azure OpenAI 問「以下文字是否含 PII？列出位置」
   - **If PII found**: redact (`[REDACTED]`) + flag in `SourceRef`

5. **Schema validation**
   - 確認 6 IPO 欄位都非空
   - 確認 Title < 60 字
   - 失敗 → 寫 error log + Teams notify Glen，不寫 List

6. **Create SP List item**
   - **Connector**: SharePoint "Create item"
   - **List**: `AI案例庫`
   - **Fields**:
     - `Title`, `BG` (LLM 推估), `Stage` (LLM 推估), `Tools`
     - `PainPoint`, `InputJSON`, `ProcessJSON`, `OutputJSON`, `BenefitsJSON`, `BenefitsSummary`
     - `Status = "Draft"`
     - `Owner` = current_user (or extracted from filename pattern)
     - `SourceChannel = "Interview"`
     - `SourceRef = <interview filename>`
     - `Category` (LLM 推估，可 multi)
     - `SubmittedDate = utcNow()`

7. **Teams notification**
   - **Channel**: DTO team channel
   - **Message**: "新訪談萃取完成: <Title> (from <SourceRef>)。請審核：<SP item url>"

---

## Flow 2: Channel 2 — Forms Submission

### Trigger
- **Connector**: Microsoft Forms
- **Trigger**: "When a new response is submitted"
- **Form**: <Forms ID>

### Steps

1. **Get response details**
2. **(Optional) Call Azure OpenAI** to 清理 / 規範化 user input (e.g., split bullet lists, normalize Benefits 量化句式)
3. **PII redaction** (same as Flow 1 Step 4)
4. **Create SP List item** (same as Flow 1 Step 6, but `SourceChannel = "Form"`, `SourceRef = <Forms response ID>`)
5. **Teams notification** (same as Flow 1 Step 7)

---

## Flow 3: Publish Notification

### Trigger
- **Connector**: SharePoint
- **Trigger**: "When an item is modified"
- **List**: `AI案例庫`
- **Condition**: `Status` changed from "In Review" to "Published"

### Steps

1. Get item details
2. Send Teams adaptive card to `BG` channel: "你們部門案例 <Title> 已發布！"
3. Send email to `Owner`: 通知 owner 案例上架，附 SP item url

---

## Flow 4: Overdue Draft Alert

### Trigger
- **Schedule**: Daily 09:00

### Steps

1. Query SP List: `Status = Draft AND SubmittedDate < now() - 7d`
2. For each: Teams notify DTO team: "案例 <Title> 已 Draft >7 天未審核"

---

## Connector & License Requirements

| Connector | Tier | Note |
|---|---|---|
| SharePoint | Standard | included in M365 |
| Microsoft Forms | Standard | included |
| Microsoft Teams | Standard | included |
| HTTP | **Premium** | needs Power Automate per-user / per-flow Premium license |
| Azure OpenAI | (via HTTP) | needs Azure resource provisioning |

⚠️ **License blocker**: HTTP connector 是 Premium。需確認 DTO team 有 Power Automate Premium license，否則改用 Azure OpenAI 的官方 connector（若未來推出）。

---

## Run History & Audit

- Power Automate run history: 28 天 retention (Premium 90 天)
- SP List 內建 version history
- 所有 flow run logs → 同步到 SP List "AI_Flow_Audit"（待建，記 run_id / trigger_id / item_id / status）

---

## Deployment

- Phase 1: 在 Maker Portal 手動建（make.powerautomate.com）
- Phase 2: export 成 `.zip` 進 `flows/exported/` (gitignore 因含 secrets)
- Phase 3: 用 pac CLI 從 `solution.xml` 部署（對齊 `project_power_platform_poc` 路徑 C）
