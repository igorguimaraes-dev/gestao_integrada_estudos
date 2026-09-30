$ErrorActionPreference = 'Stop'

$source = Get-Content -LiteralPath '.\Makefile' -Raw

if ($source -notmatch '(?m)^\.DEFAULT_GOAL := help\s*$') {
  throw 'make deveria abrir o guia de comandos por padrao.'
}

if ($source -match '(?m)^menu:') {
  throw 'O menu interativo deveria ser removido.'
}

if ($source -match 'Abre o menu interativo') {
  throw 'O guia nao deveria informar que make abre um menu interativo.'
}

if ($source -notmatch '(?m)^install:\r?\n\t\$\(NPM\) ci\s*$') {
  throw 'make install deveria usar npm ci.'
}

if ($source -notmatch '(?m)^start: build db-up\s*$') {
  throw 'make start deveria gerar o build antes de iniciar.'
}

if ($source -notmatch '(?m)^db-up:\r?\n\tdocker compose up -d --wait postgres\s*$') {
  throw 'make db-up deveria aguardar o PostgreSQL ficar saudavel.'
}

if ($source -notmatch '(?m)^typecheck:\r?\n\t\$\(NPM\) run lint\s*$') {
  throw 'make typecheck deveria executar a checagem TypeScript.'
}

if ($source -notmatch '(?m)^lint: typecheck\s*$') {
  throw 'make lint deveria continuar como atalho para typecheck.'
}

if ($source -notmatch '(?m)^check: typecheck test\s*$') {
  throw 'make check deveria executar typecheck e testes.'
}
