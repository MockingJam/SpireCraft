# Runs the headless effect self-test (dev/EffectSelfTest.java) on a throwaway server world
# and prints the PASS/FAIL lines.  Usage:  powershell -File tools\selftest.ps1
$root = Split-Path $PSScriptRoot -Parent
$runDir = Join-Path $root 'run-selftest'
New-Item -ItemType Directory -Force $runDir | Out-Null
Set-Content (Join-Path $runDir 'eula.txt') 'eula=true'
Set-Content (Join-Path $runDir 'server.properties') "online-mode=false`nlevel-name=selftest`nlevel-seed=20261112`nspawn-protection=0"
Remove-Item -Recurse -Force (Join-Path $runDir 'selftest') -ErrorAction SilentlyContinue

$env:JAVA_HOME = Join-Path $root '..\Forge1.21.10-Lazypack\runtime\jdk-21.0.9+10'
$env:SPIRECRAFT_SELFTEST = '1'
$env:SPIRECRAFT_RUN_DIR = $runDir
Push-Location $root
& .\gradlew.bat runServer --offline --no-daemon "-Dnet.minecraftforge.gradle.check.certs=false" -g ..\Forge1.21.10-Lazypack\.gradle_repo 2>&1 |
    Select-String -Pattern '\[SelfTest\]|BUILD|Exception in|Crash' |
    ForEach-Object { $_.Line }
Pop-Location
