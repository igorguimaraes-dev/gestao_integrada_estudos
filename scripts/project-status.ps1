$ErrorActionPreference = 'Stop'

try {
  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 1
  if ($health.status -eq 'ok') {
    Write-Host 'App: ativo (http://localhost:3000)'
  }
  else {
    Write-Host 'App: indisponivel'
  }
}
catch {
  Write-Host 'App: indisponivel'
}

try {
  $runningServices = & docker compose ps --status running --services 2>$null
  if ($LASTEXITCODE -eq 0 -and $runningServices -contains 'postgres') {
    Write-Host 'Banco PostgreSQL: ativo'
  }
  else {
    Write-Host 'Banco PostgreSQL: parado'
  }
}
catch {
  Write-Host 'Banco PostgreSQL: indisponivel'
}
