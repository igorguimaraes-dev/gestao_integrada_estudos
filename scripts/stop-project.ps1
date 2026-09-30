$ErrorActionPreference = 'Stop'

$port = 3000
$listenerLine = netstat -ano -p TCP |
  Where-Object { $_ -match "^\s*TCP\s+\S*:$port\s+\S+\s+LISTENING\s+(\d+)\s*$" } |
  Select-Object -First 1

if ($listenerLine) {
  $listenerLine -match "\s+(\d+)\s*$" | Out-Null
  $ownerPid = [int]$Matches[1]

  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 1
    if ($health.status -eq 'ok') {
      Stop-Process -Id $ownerPid -Force
      Write-Host "App encerrado (PID $ownerPid)."
    }
    else {
      Write-Host "A porta $port nao pertence a uma instancia saudavel da Gestao Integrada; nenhum processo foi encerrado."
    }
  }
  catch {
    Write-Host "A porta $port nao pertence a uma instancia saudavel da Gestao Integrada; nenhum processo foi encerrado."
  }
}
else {
  Write-Host 'App: ja estava parado.'
}

& docker compose down
exit $LASTEXITCODE
