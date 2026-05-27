@echo off
chcp 65001 >nul
title Claudio - Discord Bot

color 0A
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║           CLAUDIO - BOT DE DISCORD CON CLAUDE        ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  REQUISITOS:
echo  ─────────────────────────────────────────────────────
echo  [1] Claude Code instalado y con sesion activa (cuenta Pro)
echo      Verificar con: claude -p "hola"
echo.
echo  [2] Node.js instalado
echo      Verificar con: node --version
echo.
echo  [3] Archivo .env configurado con:
echo      DISCORD_TOKEN=tu_token_del_bot
echo      DISCORD_CHANNEL_ID=id_del_canal
echo.
echo  USO EN DISCORD:
echo  ─────────────────────────────────────────────────────
echo  Escribe en el canal configurado:
echo      @Claudio [tu pregunta]
echo      !claude  [tu pregunta]
echo.
echo  PARA APAGAR EL BOT:
echo  ─────────────────────────────────────────────────────
echo      Presiona CTRL + C en esta ventana
echo      Luego escribe S y Enter para confirmar
echo.
echo  ══════════════════════════════════════════════════════
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Node.js no encontrado. Instalar desde https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Verificar Claude
where claude >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Claude Code no encontrado. Instalar desde https://claude.ai/download
    echo.
    pause
    exit /b 1
)

:: Verificar .env
if not exist "%~dp0.env" (
    color 0C
    echo  [ERROR] Archivo .env no encontrado.
    echo  Copia .env.example a .env y completa los valores.
    echo.
    pause
    exit /b 1
)

:: Verificar node_modules
if not exist "%~dp0node_modules" (
    echo  [INFO] Instalando dependencias por primera vez...
    echo.
    cd /d "%~dp0"
    npm install
    echo.
)

echo  [OK] Todo listo. Iniciando Claudio...
echo.

cd /d "%~dp0"
node bot.js

echo.
echo  Bot detenido.
pause
