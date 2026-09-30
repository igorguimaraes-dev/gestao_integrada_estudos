$ErrorActionPreference = 'Stop'

$output = (& make help 2>&1 | Out-String)
$makeExitCode = $LASTEXITCODE

if ($makeExitCode -ne 0) {
  throw "make help deveria encerrar com sucesso. Saida:`n$output"
}

foreach ($section in 'PRIMEIRA EXECUCAO', 'INICIAR O AMBIENTE', 'ACOMPANHAR O AMBIENTE', 'VALIDAR ANTES DE ENTREGAR', 'ENCERRAR O AMBIENTE', 'MANUTENCAO') {
  if ($output -notmatch [regex]::Escape($section)) {
    throw "make help deveria agrupar os comandos na secao $section. Saida:`n$output"
  }
}

foreach ($command in 'make install', 'make setup', 'make dev', 'make open', 'make status', 'make logs', 'make check', 'make build', 'make stop', 'make clean', 'make reset', 'make help') {
  if ($output -notmatch [regex]::Escape($command)) {
    throw "make help deveria listar $command. Saida:`n$output"
  }
}

foreach ($command in 'setup', 'logs', 'stop', 'reset') {
  $dryRunOutput = (& make --dry-run $command 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) {
    throw "make $command deveria estar disponivel. Saida:`n$dryRunOutput"
  }
}
