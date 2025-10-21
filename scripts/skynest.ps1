param(
  [ValidateSet('up','down','logs','rebuild','ps','health')]
  [string]$Cmd = 'up',
  [ValidateSet('api','api-dev')]
  [string]$Service = 'api'
)

function Invoke-Compose {
  param([string[]]$Args)
  docker compose @Args
}

switch ($Cmd) {
  'up' {
    Invoke-Compose -Args @('up','-d','--build',$Service)
  }
  'rebuild' {
    Invoke-Compose -Args @('up','-d','--build',$Service)
  }
  'down' {
    Invoke-Compose -Args @('stop',$Service)
  }
  'logs' {
    Invoke-Compose -Args @('logs','-f',$Service)
  }
  'ps' {
    Invoke-Compose -Args @('ps')
  }
  'health' {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing http://localhost:3000/health -TimeoutSec 8
      Write-Output $resp.Content
    } catch {
      Write-Error $_.Exception.Message
      exit 1
    }
  }
}

