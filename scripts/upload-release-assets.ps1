# 将本机构建的 Windows 安装包上传到 GitHub Release（需先推送 tag，例如 v1.5.0）
# 用法（PowerShell）：
#   $env:GITHUB_TOKEN = "ghp_xxxx"   # classic PAT，勾选 repo
#   .\scripts\upload-release-assets.ps1 -Tag v1.5.0
param(
  [Parameter(Mandatory = $false)]
  [string] $Tag = "v1.5.0",
  [string] $Token = $env:GITHUB_TOKEN,
  [string] $Owner = "VicZhang6",
  [string] $Repo = "standup-reminder"
)

$ErrorActionPreference = "Stop"
if (-not $Token) {
  Write-Error "请设置环境变量 GITHUB_TOKEN（GitHub Settings → Developer settings → Personal access tokens，勾选 repo）。"
}

$root = Split-Path $PSScriptRoot -Parent
$bundle = Join-Path $root "src-tauri\target\release\bundle"
$msi = Get-ChildItem -Path (Join-Path $bundle "msi") -Filter "*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
$setup = Get-ChildItem -Path (Join-Path $bundle "nsis") -Filter "*-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $msi -or -not $setup) {
  Write-Error "未找到构建产物。请先在仓库根目录执行: npm run build"
}

$headers = @{
  Authorization = "Bearer $Token"
  Accept        = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$ver = $Tag.TrimStart("v")
$releaseBody = @"
站立提醒 v$ver

## Windows
- **MSI**：`$($msi.Name)`
- **安装程序 (NSIS)**：`$($setup.Name)`
"@

$createBody = @{
  tag_name   = $Tag
  name       = "Release $Tag"
  body       = $releaseBody
  draft      = $false
  prerelease = $false
} | ConvertTo-Json

$releasesUri = "https://api.github.com/repos/$Owner/$Repo/releases"
$existing = $null
try {
  $existing = Invoke-RestMethod -Uri "$releasesUri/tags/$Tag" -Headers $headers -Method Get
} catch {
  $existing = $null
}

if ($existing) {
  Write-Host "Release $Tag 已存在，将上传/覆盖同名资源（若需请先删除旧资源）。"
  $release = $existing
} else {
  Write-Host "创建 Release $Tag ..."
  $release = Invoke-RestMethod -Uri $releasesUri -Headers $headers -Method Post -Body $createBody -ContentType "application/json; charset=utf-8"
}

$uploadUrl = $release.upload_url -replace "\{\?name,label\}", ""

function Upload-Asset([string] $Path) {
  $name = [System.IO.Path]::GetFileName($Path)
  $enc = [System.Uri]::EscapeDataString($name)
  $uri = "$uploadUrl?name=$enc"
  Write-Host "上传: $name"
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $bytes -ContentType "application/octet-stream"
}

Upload-Asset $msi.FullName
Upload-Asset $setup.FullName
Write-Host "完成: $($release.html_url)"
