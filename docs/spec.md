# Primax AI Cases — Master Spec

> 主規格文件。任何實作變更先更新此檔，再動 code。

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SOURCE LAYER (3 channels)                      │
├─────────────────────────────────────────────────────────────────────┤
│ Channel 1: 訪談主動萃取                                              │
│   - 錄音 (m4a/mp4) → faster-whisper / Groq → 逐字稿                  │
│   - 文字稿 (docx/md/pdf) → 直接進 extraction                         │
│   - Trigger: SharePoint folder /Interviews-Inbox/ 新檔               │
│                                                                       │
│ Channel 2: 員工自助送件                                              │
│   - Microsoft Forms 表單（見 docs/form-channel-spec.md）             │
│   - Trigger: Forms response submitted                                │
│                                                                       │
│ Channel 3: Baseline 遷移                                             │
│   - 既有 8 案例卡 (D:\OneDrive\...\09-AI-Adoption-Status\)           │
│   - Slide 12 20+ 案例（0517_short.pptx）                             │
│   - 手動或批次 Python 一次性灌入                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION LAYER (Azure OpenAI)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Power Automate cloud flow:                                           │
│   1. Trigger (channel-specific)                                      │
│   2. Get text content (transcribe if audio)                          │
│   3. Call Azure OpenAI (prompts see flows/azure-openai-prompts.md)   │
│   4. PII redaction (regex pass + LLM secondary check)                │
│   5. Validate schema (6 IPO fields populated)                        │
│   6. POST /_api/web/lists/getbytitle('AI案例庫')/items               │
│      with Status=Draft, SourceChannel=<channel>, SourceRef=<id>      │
│   7. Send Teams notification to DTO team                             │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         SSOT LAYER (SharePoint)                      │
├─────────────────────────────────────────────────────────────────────┤
│ Site: primaxgroup.sharepoint.com/sites/DTO-Office                    │
│ Lists:                                                                │
│   - AI案例庫    (主 SSOT，schema in backend/sp-list-schema.md)        │
│   - AI_Prompts  (員工分享 prompt)                                    │
│   - AI_Events   (活動紀錄)                                           │
│                                                                       │
│ Governance Gates:                                                    │
│   Draft  ─→  In Review  ─→  Published                                │
│            (DTO assigns)   (DTO clicks publish)                      │
│   Required for Published:                                            │
│     - All 6 IPO fields non-empty                                     │
│     - PII redaction passed                                           │
│     - EvidenceUrl filled (D-C4-3)                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER (2-tier)                      │
├─────────────────────────────────────────────────────────────────────┤
│ Tier 1: AI Home Page (Card Grid)                                     │
│   - hub-dynamic.html / index.html                                    │
│   - Filter: BG / Stage / Category / Search                           │
│   - Card content: Title, BG badge, Tools, BenefitsSummary            │
│                                                                       │
│ Tier 2: Detail Modal (Click card → open)                             │
│   - Pain Point                                                       │
│   - Input (list)                                                     │
│   - Process (list)                                                   │
│   - Output (list)                                                    │
│   - Benefits (list, accent color)                                    │
│   - Like button + Comment thread (SP native)                         │
│   - EvidenceUrl link (if present)                                    │
│                                                                       │
│ Deployment: SP Site Assets                                           │
│   - Embed via iframe in SP Modern Page or Viva Connections           │
│   - Or direct URL access                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Transcription | faster-whisper (local) + Groq whisper-large-v3-turbo (fallback) | own-voice-get 已驗證；Groq 是 fallback 不是主力（D-NEW-04 內網優先） |
| Flow orchestration | Power Automate cloud flow | MS 環境原生 |
| AI extraction | Azure OpenAI (GPT-4.1 or o4-mini) | D-NEW-04 內網 + 合規 |
| PII redaction | regex pass + LLM secondary | 對齊 Glen PIPL/GDPR feedback |
| SSOT | SharePoint List | 集團原生 + zero license |
| Frontend | Static HTML + JS (vanilla) | 不依賴 build step，部署簡單 |
| Deployment | PnP PowerShell | 跟 `backend/deploy-sharepoint.ps1` 一致 |

---

## 3. Field Mapping

V5 IPO 6 欄位 ↔ SP List schema 對應：

| V5 IPO | SP List Internal Name | Frontend display |
|---|---|---|
| Title | `Title` | Card title + modal title |
| Pain Point | `PainPoint` | Modal section 1 |
| Input | `InputJSON` (JSON array) | Modal section 2 (bullet list) |
| Process | `ProcessJSON` | Modal section 3 (bullet list) |
| Output | `OutputJSON` | Modal section 4 (bullet list) |
| Benefits | `BenefitsJSON` | Modal section 5 (bullet list) + `BenefitsSummary` card footer |

---

## 4. Phase Plan

### Phase 0: Preview (now)
- ✅ `index.html` 已實作 Tier 1+2 preview，給 mgmt review
- GitHub Pages 上 (no backend)
- 內含 hardcoded CASES array

### Phase 1: SP Backend Setup
- [ ] 跑 `backend/deploy-sharepoint.ps1`：建 `AI_Prompts` + `AI_Events`、給 `AI案例庫` 加 `Stage`
- [ ] 手動加新欄位（Status / Owner / Reviewer / EvidenceUrl / SourceChannel / SourceRef / Category / SubmittedDate / PublishedDate）— 寫 Step 5b 補腳本
- [ ] 啟用 List Comments + Likes
- [ ] 設定 6 個 Views
- [ ] 灌入 baseline 8 案例（手動或 Python batch）

### Phase 2: Frontend SP-Connected
- [ ] `hub-dynamic.html` 改為讀 SP List (REST API or Microsoft Graph)
- [ ] 部署到 SP Site Assets
- [ ] 在 DTO-Office SP Modern Page 嵌 iframe

### Phase 3: Extraction Flow
- [ ] 申請 Azure OpenAI resource（撞 `project_ms_ai_playbook` B2 blocker）
- [ ] 寫 Power Automate cloud flow（見 `flows/extraction-flow.md`）
- [ ] 測 Channel 1 訪談萃取 PoC（1 個既有訪談）
- [ ] 測 Channel 2 Forms 送件 PoC（1 筆 Forms submit）

### Phase 4: Production
- [ ] 全 BG 公告開放送件
- [ ] BG ambassadors 認領 baseline metadata 補齊
- [ ] DTO weekly review meeting：清 Draft queue

---

## 5. Governance & Security

| Gate | What | Where |
|---|---|---|
| PII redaction | regex（員工 ID/薪資/電話/email）+ LLM 二次掃描 | flow step 4 |
| Required fields for Publish | 6 IPO + EvidenceUrl + Status validation | flow gate or List validation |
| Status state machine | Draft → In Review → Published（單向） | List validation |
| Audit log | SP List 內建 version history + flow run history | inherent |
| Cross-border | 用 Azure OpenAI tenant (TW region) 避 PIPL | D-NEW-04 |

---

## 6. Cross-References

| 相關專案 | 關係 |
|---|---|
| `project_ai_adoption_status` | Baseline 8 案例 + `build_unit_progress_pptx.py` 自動化腳本（可改寫成「讀 SP List → 生 Slide 8」）|
| `project_ai_empowerment_deck` | Category enum 沿用 Type 1×6 + Type 2×4 (10 類) |
| `project_dto_task_status_system` (L4) | Sister List on 同 SP site |
| `project_power_platform_poc` | Cloud flow 設計參考 |
| `project_ms_ai_playbook` | IT 申請（Service Principal）+ Azure OpenAI provisioning |
| `project_knowledge_hub` | 已 archived，資產併入此 repo |
| `project_dto_use_case_form` (A5) | 已 supersede，spec 併入 `docs/form-channel-spec.md` |
