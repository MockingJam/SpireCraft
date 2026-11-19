# Dev screenshots (dev/ClientShots.java): runs the client with a shot script and leaves run/screenshots/<name>.png.
# Usage: powershell -File tools\shots.ps1 <script.txt>
param([string]$Script)
$root = Split-Path $PSScriptRoot -Parent
$env:JAVA_HOME = Join-Path $root '..\Forge1.21.10-Lazypack\runtime\jdk-21.0.9+10'
$env:SPIRECRAFT_SHOTS = (Resolve-Path $Script).Path
Push-Location $root
& .\gradlew.bat runClient --offline --no-daemon "-Dnet.minecraftforge.gradle.check.certs=false" -g ..\Forge1.21.10-Lazypack\.gradle_repo 2>&1 |
    Select-String -Pattern '\[Shots\]|BUILD|Exception in|Crash|ERROR' |
    ForEach-Object { $_.Line }
Pop-Location
