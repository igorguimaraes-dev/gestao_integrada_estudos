$ErrorActionPreference = 'Continue'

$output = (& make dev 2>&1 | Out-String)
$makeExitCode = $LASTEXITCODE

if ($makeExitCode -ne 0) {
  throw "make dev deveria encerrar com sucesso quando o app ja esta ativo. Saida:`n$output"
}

if ($output -notmatch 'Gestao Integrada ja esta ativo em http://localhost:3000') {
  throw "make dev deveria informar o endereco navegavel do app ja ativo. Saida:`n$output"
}
