$ErrorActionPreference = 'Stop'

$port = 3000
$listenerLine = netstat -ano -p TCP |
  Where-Object { $_ -match "^\s*TCP\s+\S*:$port\s+\S+\s+LISTENING\s+(\d+)\s*$" } |
  Select-Object -First 1

if (-not $listenerLine) {
  exit 0
}

$listenerLine -match "\s+(\d+)\s*$" | Out-Null
$ownerPid = $Matches[1]

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 1
  if ($health.status -eq 'ok') {
    Write-Host "Gestao Integrada ja esta ativo em http://localhost:$port."
    exit 2
  }
}
catch {
  # A porta esta ocupada, mas o processo nao respondeu como o Gestao Integrada.
}

$owner = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerPid" -ErrorAction SilentlyContinue
$details = if ($owner) { "PID $($owner.ProcessId) ($($owner.Name))" } else { "PID $ownerPid" }

Write-Host "Porta 3000 ja esta em uso por $details."
if ($owner -and $owner.CommandLine) {
  Write-Host "Comando: $($owner.CommandLine)"
}
exit 1
