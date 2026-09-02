#Requires -Version 5.1
<#
.SYNOPSIS
  Create a NEW Render web service for the Nexperts API (does not touch nexperts-api).
#>
param(
  [string]$EnvFile = (Join-Path (Join-Path $PSScriptRoot "..") ".env.render.local")
)

$ErrorActionPreference = "Stop"

function Read-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { throw "Missing $Path - copy .env.render.local.example" }
  $map = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $map[$line.Substring(0, $idx).Trim()] = $line.Substring($idx + 1).Trim()
  }
  return $map
}

$cfg = Read-DotEnv $EnvFile
$apiKey = $cfg["RENDER_API_KEY"]
if (-not $apiKey) { throw "RENDER_API_KEY required" }

$name = if ($cfg["SERVICE_NAME"]) { $cfg["SERVICE_NAME"] } else { "nexperts-ecommerce-api" }
$repo = "https://github.com/iqmathanalytics/Nexperts.Ecommerce.git"

$headers = @{
  Authorization  = "Bearer $apiKey"
  Accept         = "application/json"
  "Content-Type" = "application/json"
}

Write-Host "Checking for existing service named '$name'..."
$existing = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers
$found = $existing | ForEach-Object { $_.service } | Where-Object { $_.name -eq $name } | Select-Object -First 1
if ($found) {
  Write-Host "Service already exists: $($found.id) -> $($found.serviceDetails.url)"
  $serviceId = $found.id
} else {
  Write-Host "Fetching Render owner..."
  $owners = Invoke-RestMethod -Uri "https://api.render.com/v1/owners" -Headers $headers
  $owner = $owners[0].owner
  if (-not $owner) { throw "No Render owner found on this account" }
  Write-Host "Creating web service '$name' in region singapore..."

  $body = @{
    type           = "web_service"
    name           = $name
    ownerId        = $owner.id
    repo           = $repo
    branch         = "main"
    rootDir        = "backend"
    autoDeploy     = "yes"
    serviceDetails = @{
      runtime         = "node"
      region          = "singapore"
      plan            = "free"
      healthCheckPath = "/health"
      preDeployCommand = "npm run db:migrate"
      envSpecificDetails = @{
        buildCommand = "npm ci --include=dev && npm run build"
        startCommand = "npm start"
      }
    }
  } | ConvertTo-Json -Depth 8

  $created = Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services" -Headers $headers -Body $body
  $serviceId = $created.service.id
  Write-Host "Created service: $serviceId"
}

$envKeys = @("DATABASE_URL", "JWT_SECRET", "FRONTEND_URL", "ADMIN_FRONTEND_URL", "JWT_EXPIRES_IN", "COOKIE_SECURE", "SITE_NAME", "PAYMENT_PROVIDER", "TAX_RATE", "FREE_SHIPPING_MIN", "SHIPPING_FLAT")
$payload = @()
foreach ($key in $envKeys) {
  if ($cfg.ContainsKey($key) -and $cfg[$key]) {
    $payload += @{ key = $key; value = $cfg[$key] }
  }
}
if ($payload.Count -eq 0) { throw "No env vars in .env.render.local" }

Write-Host "Setting $($payload.Count) environment variable(s)..."
Invoke-RestMethod -Method Put -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Body ($payload | ConvertTo-Json -Depth 5) | Out-Null

Write-Host "Triggering deploy..."
Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Body "{}" | Out-Null

$s = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId" -Headers $headers
$url = $s.serviceDetails.url
Write-Host ""
Write-Host "=== Done ==="
Write-Host "Service:  $name"
Write-Host "ID:       $serviceId"
Write-Host "URL:      $url"
Write-Host "Health:   $url/health"
Write-Host "Dashboard: https://dashboard.render.com/web/$serviceId"
