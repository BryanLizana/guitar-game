@echo off
chcp 65001 >nul
title NAM Web Player

echo.
echo  =============================================
echo   NAM Web Player - Neural Amp Modeler
echo  =============================================
echo.

:: --- Verificar Node.js ---
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js no esta instalado.
    echo.
    echo  Descargalo en: https://nodejs.org/
    echo  Instala la version LTS y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  Node.js encontrado: %NODE_VER%

:: --- Ir a la carpeta ui ---
cd /d "%~dp0ui"

:: --- Instalar dependencias si no existen ---
if not exist "node_modules\" (
    echo.
    echo  Instalando dependencias por primera vez...
    echo  (esto puede tardar 1-2 minutos)
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  [ERROR] Fallo npm install. Revisa tu conexion a internet.
        pause
        exit /b 1
    )
) else (
    echo  Dependencias OK.
)

:: --- Verificar archivos WASM ---
if not exist "public\t3k-wasm-module.wasm" (
    echo.
    echo  [ERROR] Faltan archivos WASM en public\
    echo  El repo puede estar incompleto. Intenta:
    echo    git pull
    pause
    exit /b 1
)
echo  Archivos WASM OK.

:: --- Abrir navegador despues de 3 segundos ---
echo.
echo  Iniciando servidor en http://localhost:5174 ...
echo  (abriendo navegador en 3 segundos)
echo.
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5174"

:: --- Iniciar Vite ---
npx vite --port 5174

:: Si Vite termina (Ctrl+C), mostrar mensaje
echo.
echo  Servidor detenido.
pause
