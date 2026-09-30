$ErrorActionPreference = 'Stop'

$output = (& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\scripts\project-status.ps1' 2>&1 | Out-String)

if ($output -notmatch 'App: ativo \(http://localhost:3000\)') {
  throw "O status deveria informar o app ativo com um endereco navegavel. Saida:`n$output"
}

if ($output -notmatch 'Banco PostgreSQL:') {
  throw "O status deveria incluir o estado do banco PostgreSQL. Saida:`n$output"
}
