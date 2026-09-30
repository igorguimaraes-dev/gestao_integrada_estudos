$ErrorActionPreference = 'Stop'

$source = Get-Content -LiteralPath '.\server.ts' -Raw

if ($source -notmatch 'Servidor ativo em http://localhost:\$\{PORT\}') {
  throw 'O log de inicializacao deveria mostrar http://localhost:3000, nao 0.0.0.0.'
}
