# =====================================================================
# AI Hub — SharePoint 部署腳本
# 用途：建立 AI_Prompts / AI_Events list、給 AI案例庫加 Stage 欄、
#       上傳 hub-dynamic.html + style.css 到 Site Assets
# 執行方式：在 PowerShell 7 (pwsh) 視窗貼上整段執行
# =====================================================================

# ====== 設定區（執行前必須確認/修改）======
$SiteUrl       = "https://primaxgroup.sharepoint.com/sites/DTO-Office"  # ⚠️ 改成正確 URL
$LocalHtmlDir  = "C:\Users\glen.ho\Projects\primax-ai-cases"
$FilesToUpload = @("hub-dynamic.html", "style.css", "index.html")
# Canonical list name (DP-1 lock 2026-05-19): AICases_v2 為新建乾淨 schema list
# 若選擇直接覆蓋既有 AI案例庫 (Migration Option A 砍重建)，改成 "AI案例庫"
$CaseListTitle = "AICases_v2"
# PnP Management Shell 官方 ClientId（若你的 IT 已封鎖此 app，需註冊自己的 Entra app 並換成新 ID）
$PnPClientId   = "31359c7f-bd7e-475c-86db-fdb8c937548e"
# =========================================

$ErrorActionPreference = "Continue"

function Write-Step($num, $msg) {
    Write-Host "`n[$num] $msg" -ForegroundColor Cyan
}
function Write-OK($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  - $msg (已存在，跳過)" -ForegroundColor DarkGray }
function Write-Err($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }


# =====================================================================
# Step 1: 安裝 / 載入 PnP.PowerShell
# =====================================================================
Write-Step 1 "檢查 PnP.PowerShell 模組"

$pnp = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
if (-not $pnp) {
    Write-Host "  尚未安裝，現在執行 user-scope 安裝（無需管理員權限）…" -ForegroundColor Yellow
    try {
        Install-Module PnP.PowerShell -Scope CurrentUser -Force -AllowClobber -SkipPublisherCheck
        Write-OK "PnP.PowerShell 安裝完成"
    } catch {
        Write-Err "安裝失敗：$_"
        Write-Host "  可改為手動執行：Install-Module PnP.PowerShell -Scope CurrentUser" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-OK "已安裝 PnP.PowerShell v$($pnp.Version)"
}

Import-Module PnP.PowerShell -Force


# =====================================================================
# Step 2: 連線 SharePoint（互動式登入 + MFA）
# =====================================================================
Write-Step 2 "連線 $SiteUrl"

try {
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $PnPClientId -ErrorAction Stop
    $web = Get-PnPWeb
    Write-OK "已連線到：$($web.Title) ($($web.Url))"
} catch {
    Write-Err "連線失敗：$_"
    Write-Host @"
  常見原因：
   (a) ClientId 被 IT 封鎖 → 請 IT 註冊 Entra App（Sites.Manage.All / AllSites.Manage 權限）後替換 \$PnPClientId
   (b) URL 錯誤 → 確認站台 URL（瀏覽器網址列複製，去除 /SitePages/...）
   (c) MFA 視窗未彈出 → 確認系統預設瀏覽器，並重試
"@ -ForegroundColor Yellow
    exit 1
}


# =====================================================================
# Step 3: 建立 AI_Prompts list
# =====================================================================
Write-Step 3 "建立 AI_Prompts list"

$promptList = Get-PnPList -Identity "AI_Prompts" -ErrorAction SilentlyContinue
if (-not $promptList) {
    New-PnPList -Title "AI_Prompts" -Template GenericList -OnQuickLaunch | Out-Null
    Write-OK "List 建立"

    $promptFields = @(
        @{Display="Department"; Internal="Department"; Type="Choice"; Choices=@("HR","IT","FA","RD","MFG","ESG","GEN")}
        @{Display="UseCase";    Internal="UseCase";    Type="Text"}
        @{Display="PromptBody"; Internal="PromptBody"; Type="Note"}
        @{Display="Tools";      Internal="Tools";      Type="Text"}
        @{Display="Author";     Internal="Author";     Type="Text"}
    )
    foreach ($f in $promptFields) {
        try {
            if ($f.Type -eq "Choice") {
                Add-PnPField -List "AI_Prompts" -DisplayName $f.Display -InternalName $f.Internal -Type Choice -Choices $f.Choices -AddToDefaultView | Out-Null
            } else {
                Add-PnPField -List "AI_Prompts" -DisplayName $f.Display -InternalName $f.Internal -Type $f.Type -AddToDefaultView | Out-Null
            }
            Write-OK "欄位 $($f.Internal) ($($f.Type))"
        } catch {
            Write-Err "新增欄位 $($f.Internal) 失敗：$_"
        }
    }
} else {
    Write-Skip "AI_Prompts"
}


# =====================================================================
# Step 4: 建立 AI_Events list
# =====================================================================
Write-Step 4 "建立 AI_Events list"

$eventList = Get-PnPList -Identity "AI_Events" -ErrorAction SilentlyContinue
if (-not $eventList) {
    New-PnPList -Title "AI_Events" -Template GenericList -OnQuickLaunch | Out-Null
    Write-OK "List 建立"

    $eventFields = @(
        @{Display="EventDate";   Internal="EventDate";   Type="DateTime"}
        @{Display="Host";        Internal="Host";        Type="Text"}
        @{Display="Audience";    Internal="Audience";    Type="Text"}
        @{Display="Highlights";  Internal="Highlights";  Type="Note"}
        @{Display="SlidesUrl";   Internal="SlidesUrl";   Type="URL"}
        @{Display="VideoUrl";    Internal="VideoUrl";    Type="URL"}
        @{Display="DocumentUrl"; Internal="DocumentUrl"; Type="URL"}
    )
    foreach ($f in $eventFields) {
        try {
            Add-PnPField -List "AI_Events" -DisplayName $f.Display -InternalName $f.Internal -Type $f.Type -AddToDefaultView | Out-Null
            Write-OK "欄位 $($f.Internal) ($($f.Type))"
        } catch {
            Write-Err "新增欄位 $($f.Internal) 失敗：$_"
        }
    }
} else {
    Write-Skip "AI_Events"
}


# =====================================================================
# Step 5: 建立 AICases_v2 list (canonical 38-col schema, 2026-05-19 DP-1 lock)
# 若要用既有 list 而非新建，把 $CaseListTitle 改成既有 list 名稱
# =====================================================================
Write-Step 5 "建立 / 補欄 $CaseListTitle (canonical 38 cols)"

$caseList = Get-PnPList -Identity $CaseListTitle -ErrorAction SilentlyContinue
if (-not $caseList) {
    New-PnPList -Title $CaseListTitle -Template GenericList -OnQuickLaunch | Out-Null
    Write-OK "List '$CaseListTitle' 建立"
} else {
    Write-OK "List '$CaseListTitle' 已存在，將補欄位"
}

# 38-col canonical schema. Internal name 用 underscore_case 保持英文。
# 既有 Title 是 SP 內建（List 一定有），跳過。
$caseFields = @(
    # Identity & summary (除 Title 外)
    @{Display="BG (verbatim)"; Internal="BG"; Type="Text"}
    @{Display="Company"; Internal="Company"; Type="Choice"; Choices=@("PMX","TYM")}
    @{Display="Unit"; Internal="Unit"; Type="Text"}
    @{Display="Region"; Internal="Region"; Type="Text"}
    @{Display="Tools"; Internal="Tools"; Type="Text"}
    @{Display="Benefits Summary"; Internal="Benefits_Summary"; Type="Text"}
    @{Display="Stage (verbatim)"; Internal="Stage"; Type="Text"}
    @{Display="Stage Norm"; Internal="Stage_Norm"; Type="Choice"; Choices=@("Deploy","Development","Prototype","Planning","Stalled","Other")}

    # Problem & Before/After narrative
    @{Display="Pain Point"; Internal="Pain_Point"; Type="Note"}
    @{Display="Before — How"; Internal="Before_How"; Type="Note"}
    @{Display="Before — Pain"; Internal="Before_Pain"; Type="Note"}
    @{Display="After — How"; Internal="After_How"; Type="Note"}
    @{Display="After — Outcome"; Internal="After_Outcome"; Type="Note"}

    # IPO engineering view
    @{Display="Input"; Internal="Input"; Type="Note"}
    @{Display="Process"; Internal="Process"; Type="Note"}
    @{Display="Output"; Internal="Output"; Type="Note"}
    @{Display="Benefits"; Internal="Benefits"; Type="Note"}

    # Story & owner
    @{Display="Build Story"; Internal="Build_Story"; Type="Note"}
    @{Display="Owner Name"; Internal="Owner_Name"; Type="Text"}
    @{Display="Owner Role"; Internal="Owner_Role"; Type="Text"}
    @{Display="Owner Dept"; Internal="Owner_Dept"; Type="Text"}
    @{Display="Owner Background"; Internal="Owner_Background"; Type="Note"}
    @{Display="Owner Photo"; Internal="Owner_Photo"; Type="URL"}
    @{Display="Owner Email"; Internal="Owner_Email"; Type="Text"}
    @{Display="Quote"; Internal="Quote"; Type="Note"}

    # V5 Card alignment
    @{Display="Category Matrix"; Internal="Category_Matrix"; Type="Choice"; Choices=@("個人×RPA","個人×AI","組織×RPA","組織×AI","合併")}
    @{Display="ECRS"; Internal="ECRS"; Type="Text"}
    @{Display="Maturity Indicator"; Internal="Maturity_Indicator"; Type="Choice"; Choices=@("🟢 穩定運行","🟡 進行中","灰 6 月未更新")}

    # SP-only adopted
    @{Display="Reviewer"; Internal="Reviewer"; Type="User"}
    @{Display="Evidence URL"; Internal="EvidenceUrl"; Type="URL"}
    @{Display="Source Channel"; Internal="SourceChannel"; Type="Choice"; Choices=@("Interview","Form","Migrated")}

    # Provenance
    @{Display="Source Meeting"; Internal="Source_Meeting"; Type="Text"}
    @{Display="Verification Status"; Internal="Verification_Status"; Type="Choice"; Choices=@("Draft","Single-source","Verified","Owner-confirmed")}

    # Lifecycle (Publish_Status axis) — Last_Updated/Updated_By 用 SP 內建 Modified/Editor
    @{Display="Publish Status"; Internal="Publish_Status"; Type="Choice"; Choices=@("Draft","Active-Internal","Active-Published","Archived")}
    @{Display="Publish Date"; Internal="Publish_Date"; Type="DateTime"}
    @{Display="Archive Date"; Internal="Archive_Date"; Type="DateTime"}
    @{Display="Archive Reason"; Internal="Archive_Reason"; Type="Text"}
)

foreach ($f in $caseFields) {
    $existing = Get-PnPField -List $CaseListTitle -Identity $f.Internal -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Skip "欄位 $($f.Internal)"
        continue
    }
    try {
        if ($f.Type -eq "Choice") {
            Add-PnPField -List $CaseListTitle -DisplayName $f.Display -InternalName $f.Internal `
                         -Type Choice -Choices $f.Choices -AddToDefaultView | Out-Null
        } else {
            Add-PnPField -List $CaseListTitle -DisplayName $f.Display -InternalName $f.Internal `
                         -Type $f.Type -AddToDefaultView | Out-Null
        }
        Write-OK "欄位 $($f.Internal) ($($f.Type))"
    } catch {
        Write-Err "新增欄位 $($f.Internal) 失敗：$_"
    }
}

# Enable Comments + Likes (D-NEW-05) — needs SP UI manual config or PnP CSOM (PnP no direct cmdlet for Likes)
Write-Host "  ℹ  Comments + Likes 需手動在 List Settings 啟用：" -ForegroundColor Yellow
Write-Host "       (a) Advanced settings → Allow comments = Yes" -ForegroundColor Yellow
Write-Host "       (b) Rating settings → Allow items to be rated = Yes → Likes" -ForegroundColor Yellow


# =====================================================================
# Step 6: 上傳 HTML / CSS 到 Site Assets
# =====================================================================
Write-Step 6 "上傳檔案到 Site Assets"

foreach ($file in $FilesToUpload) {
    $localPath = Join-Path $LocalHtmlDir $file
    if (-not (Test-Path $localPath)) {
        Write-Err "找不到本機檔案：$localPath"
        continue
    }
    try {
        Add-PnPFile -Path $localPath -Folder "SiteAssets" -ErrorAction Stop | Out-Null
        Write-OK "$file 上傳完成"
    } catch {
        Write-Err "上傳 $file 失敗：$_"
    }
}


# =====================================================================
# Step 7: 驗證 + 輸出存取連結
# =====================================================================
Write-Step 7 "驗證"

$siteWebUrl = (Get-PnPWeb).Url
$lists = Get-PnPList | Where-Object { $_.Title -in @("AI_Prompts", "AI_Events", $CaseListTitle) }

Write-Host "`n--- Lists ---" -ForegroundColor White
$lists | Select-Object Title, ItemCount, @{N='Url';E={ "$siteWebUrl/Lists/$($_.Title)" }} | Format-Table -AutoSize

Write-Host "--- 部署完成 ---" -ForegroundColor Green
Write-Host "AI Hub 訪問連結：" -ForegroundColor White
Write-Host "  $siteWebUrl/SiteAssets/hub-dynamic.html" -ForegroundColor Cyan
Write-Host @"

下一步：
  1. 開啟上面的連結確認頁面顯示 🟢 SharePoint 即時資料 banner
  2. 點 "+ 投稿 Prompt" 測試寫入 → 確認 AI_Prompts list 有新項目
  3. 把既有 10 筆案例的 Stage 欄位填入（Prototype/Development/Deploy）
  4. 若要嵌入 SP 頁面：用 Embed Web Part 插入
     <iframe src="$siteWebUrl/SiteAssets/hub-dynamic.html" width="100%" height="2400px" frameborder="0"></iframe>

驗證 InternalName（萬一寫入有問題用得到）：
  Invoke-PnPSPRestMethod -Url "/_api/web/lists/getbytitle('AI_Prompts')/fields?\$select=Title,InternalName&\$filter=Hidden eq false"

斷線：
  Disconnect-PnPOnline
"@ -ForegroundColor White

Disconnect-PnPOnline -ErrorAction SilentlyContinue
