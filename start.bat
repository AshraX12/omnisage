@echo off
setlocal enabledelayedexpansion
title Omnisage - Starting All Services
color 0A

:: ============================================
::  OMNISAGE - Medical Record Aggregator
::  One-click startup script
:: ============================================

echo.
echo  ============================================
echo   OMNISAGE - Starting All Services
echo  ============================================
echo.

:: --- Set working directory to where this script lives ---
cd /d "%~dp0"

:: ============================================
:: STEP 1: Find Node.js
:: ============================================
set "NODE_EXE="
set "NPM_CMD="

:: Check system PATH first
where node.exe >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where node.exe') do (
        set "NODE_EXE=%%i"
    )
)

:: Fallback: check common install locations
if not defined NODE_EXE (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)
if not defined NODE_EXE (
    if exist "%~dp0.node\node-v22.18.0-win-x64\node.exe" (
        set "NODE_EXE=%~dp0.node\node-v22.18.0-win-x64\node.exe"
        set "PATH=%~dp0.node\node-v22.18.0-win-x64;%PATH%"
    )
)
if not defined NODE_EXE (
    if exist "C:\Users\ashra\nodejs\node-v22.16.0-win-x64\node.exe" (
        set "NODE_EXE=C:\Users\ashra\nodejs\node-v22.16.0-win-x64\node.exe"
        set "PATH=C:\Users\ashra\nodejs\node-v22.16.0-win-x64;%PATH%"
    )
)

if not defined NODE_EXE (
    echo [FAIL] Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)

:: Find npm.cmd in the same directory as node.exe
for %%i in ("%NODE_EXE%") do set "NODE_DIR=%%~dpi"
set "NPM_CMD=%NODE_DIR%npm.cmd"
if not exist "%NPM_CMD%" (
    echo [FAIL] npm.cmd not found at %NPM_CMD%
    pause
    exit /b 1
)

echo [OK] Node.js: %NODE_EXE%

:: ============================================
:: STEP 2: Find Python venv
:: ============================================
set "PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    echo [FAIL] Python venv not found. Run: python -m venv backend\venv
    pause
    exit /b 1
)
echo [OK] Python venv found

:: ============================================
:: STEP 3: Check node_modules exist
:: ============================================
if not exist "%~dp0frontend\node_modules" (
    echo [WAIT] Installing frontend dependencies...
    cd /d "%~dp0frontend"
    "%NPM_CMD%" install
    cd /d "%~dp0"
)
echo [OK] Frontend dependencies ready

:: ============================================
:: STEP 4: Check PostgreSQL
:: ============================================
sc query postgresql-x64-17 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL service detected
) else (
    echo [INFO] PostgreSQL not detected - will use SQLite fallback
)

echo.
echo  Launching services...
echo.

:: ============================================
:: STEP 5: Start Ollama (if not running)
:: ============================================
curl -s -o nul -w "" http://localhost:11434/api/tags 2>nul
if %errorlevel% neq 0 (
    where ollama >nul 2>&1
    if %errorlevel% equ 0 (
        echo [1/3] Starting Ollama...
        start /min "" ollama serve
        :: Wait for Ollama to be ready
        set "OLLAMA_READY=0"
        for /l %%i in (1,1,10) do (
            if !OLLAMA_READY! equ 0 (
                timeout /t 1 /nobreak >nul
                curl -s -o nul http://localhost:11434/api/tags 2>nul
                if !errorlevel! equ 0 set "OLLAMA_READY=1"
            )
        )
        if !OLLAMA_READY! equ 1 (
            echo       Ollama ready
        ) else (
            echo       [WARN] Ollama slow to start - AI features may need a moment
        )
    ) else (
        echo [SKIP] Ollama not installed - AI features won't work
    )
) else (
    echo [1/3] Ollama already running
)

:: ============================================
:: STEP 6: Start Backend (FastAPI + Uvicorn)
:: ============================================
echo [2/3] Starting Backend on port 8000...
start "Omnisage-Backend" /min cmd /c "cd /d "%~dp0" && "%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait for backend to be ready
set "BACKEND_READY=0"
for /l %%i in (1,1,15) do (
    if !BACKEND_READY! equ 0 (
        timeout /t 1 /nobreak >nul
        curl -s -o nul http://127.0.0.1:8000/api/health 2>nul
        if !errorlevel! equ 0 set "BACKEND_READY=1"
    )
)
if %BACKEND_READY% equ 1 (
    echo       Backend ready
) else (
    echo       [WARN] Backend still starting...
)

:: ============================================
:: STEP 7: Start Frontend (Vite dev server)
:: ============================================
echo [3/3] Starting Frontend on port 5173...
start "Omnisage-Frontend" /min cmd /c "cd /d "%~dp0frontend" && "%NODE_DIR%npx.cmd" vite --host 127.0.0.1"

:: Wait for frontend to be ready
set "FRONTEND_READY=0"
for /l %%i in (1,1,10) do (
    if !FRONTEND_READY! equ 0 (
        timeout /t 1 /nobreak >nul
        curl -s -o nul http://localhost:5173 2>nul
        if !errorlevel! equ 0 set "FRONTEND_READY=1"
    )
)
if %FRONTEND_READY% equ 1 (
    echo       Frontend ready
) else (
    echo       [WARN] Frontend still starting...
)

:: ============================================
:: STEP 8: Open browser
:: ============================================
echo.
echo  ============================================
echo   ALL SERVICES STARTED!
echo  ============================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.

timeout /t 2 /nobreak >nul
start http://localhost:5173

echo  This window will close in 5 seconds.
echo  Services run in the background (check taskbar).
timeout /t 5 /nobreak >nul
exit
