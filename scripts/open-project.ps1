[CmdletBinding()]
param(
  [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$url = 'http://localhost:3000'

function Open-ProjectPage {
  if ($OpenBrowser) {
    Start-Process $url
  }
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'check-dev-port.ps1')
$portCheckExitCode = $LASTEXITCODE

if ($portCheckExitCode -eq 2) {
  Open-ProjectPage
  exit 0
}

if ($portCheckExitCode -ne 0) {
  exit $portCheckExitCode
}

& make db-up
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $projectRoot -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $deadline) {
  try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 1
    if ($health.status -eq 'ok') {
      Write-Host "Gestao Integrada pronto em $url."
      Open-ProjectPage
      exit 0
    }
  }
  catch {
    Start-Sleep -Milliseconds 500
  }
}

Write-Error 'O app nao respondeu em http://localhost:3000 dentro de 30 segundos.'
exit 1
