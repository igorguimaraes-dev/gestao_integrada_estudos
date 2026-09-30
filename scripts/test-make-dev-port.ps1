$ErrorActionPreference = 'Continue'

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 3000)
$listener.Start()

try {
  $output = (& make dev 2>&1 | Out-String)
  $makeExitCode = $LASTEXITCODE

  if ($makeExitCode -eq 0) {
    throw 'make dev deveria bloquear a inicializacao quando outro processo ocupa a porta 3000.'
  }

  if ($output -notmatch 'Porta 3000 ja esta em uso por') {
    throw "make dev deveria identificar claramente o processo que ocupa a porta 3000. Saida:`n$output"
  }
}
finally {
  $listener.Stop()
}
