<#
.SYNOPSIS
    Compila GuitarEffects y genera el APK.

.PARAMETER Type
    Tipo de build: "debug" (default) o "release"

.PARAMETER Install
    Instala el APK en dispositivo conectado via ADB.

.PARAMETER Clean
    Limpia el build antes de compilar.

.EXAMPLE
    .\build-apk.ps1
    .\build-apk.ps1 -Type release
    .\build-apk.ps1 -Clean -Install
#>
param(
    [ValidateSet("debug","release")]
    [string]$Type = "debug",
    [switch]$Install,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$SDK_PATH    = "C:\Android"
$SCRIPT_DIR  = $PSScriptRoot
$ADB         = "$SDK_PATH\platform-tools\adb.exe"
$APK_DEBUG   = "$SCRIPT_DIR\app\build\outputs\apk\debug\app-debug.apk"
$APK_RELEASE = "$SCRIPT_DIR\app\build\outputs\apk\release\app-release-unsigned.apk"

function Step($msg)  { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "   OK: $msg" -ForegroundColor Green }
function Fail($msg)  { Write-Host "   ERROR: $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $SDK_PATH)) { Fail "Android SDK no encontrado en $SDK_PATH" }

$env:ANDROID_HOME     = $SDK_PATH
$env:ANDROID_SDK_ROOT = $SDK_PATH

Write-Host ""
Write-Host "=== GuitarEffects APK Builder ===" -ForegroundColor DarkCyan
Write-Host "  Build : $Type  |  Clean: $($Clean.IsPresent)  |  Install: $($Install.IsPresent)"
Write-Host ""

if ($Clean) {
    Step "Limpiando build anterior..."
    & "$SCRIPT_DIR\gradlew.bat" clean --project-dir "$SCRIPT_DIR"
    if ($LASTEXITCODE -ne 0) { Fail "Clean fallo" }
    Ok "Limpieza completa"
}

$task = if ($Type -eq "release") { "assembleRelease" } else { "assembleDebug" }
Step "Compilando ($task)..."

$startTime = Get-Date
& "$SCRIPT_DIR\gradlew.bat" $task --project-dir "$SCRIPT_DIR"
$exitCode = $LASTEXITCODE
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)

if ($exitCode -ne 0) { Fail "Build fallo (exit $exitCode) -- revisa los errores arriba" }

$apkPath = if ($Type -eq "release") { $APK_RELEASE } else { $APK_DEBUG }

if (Test-Path $apkPath) {
    $sizeMB = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Ok "APK generado en ${elapsed}s"
    Write-Host ""
    Write-Host "  Ruta  : $apkPath" -ForegroundColor Yellow
    Write-Host "  Tamano: ${sizeMB} MB" -ForegroundColor Yellow
} else {
    Fail "APK no encontrado en $apkPath"
}

if ($Install) {
    Step "Instalando en dispositivo..."
    if (-not (Test-Path $ADB)) { Fail "adb no encontrado en $ADB" }

    $devices = & $ADB devices 2>&1 | Select-String "device$"
    if (-not $devices) {
        Fail "Ningun dispositivo conectado. Activa USB Debugging en el celular."
    }

    & $ADB install -r $apkPath
    if ($LASTEXITCODE -ne 0) { Fail "Instalacion fallida" }
    Ok "APK instalado"

    Step "Lanzando la app..."
    $pkg = if ($Type -eq "debug") { "com.guitareffects.debug" } else { "com.guitareffects" }
    & $ADB shell am start -n "$pkg/.presentation.MainActivity"
    Ok "App iniciada"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor DarkCyan
Write-Host "  BUILD OK" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor DarkCyan
Write-Host ""
