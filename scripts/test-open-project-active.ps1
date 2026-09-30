$ErrorActionPreference = 'Stop'

$output = (& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\scripts\open-project.ps1' 2>&1 | Out-String)

if ($LASTEXITCODE -ne 0) {
  throw "A abertura do projeto deveria reutilizar o app ja ativo. Saida:`n$output"
}

if ($output -notmatch 'Gestao Integrada ja esta ativo em http://localhost:3000') {
  throw "A abertura do projeto deveria usar o endereco navegavel. Saida:`n$output"
}
