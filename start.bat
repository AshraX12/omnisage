@echo off
title Omnisage - Starting All Services
color 0A

echo.
echo  ============================================
echo   OMNISAGE - Medical Record Aggregator
echo   Starting all services...
echo  ============================================
echo.

:: --- Set working directory to script location ---
cd /d "%~dp0"

:: --- Add portable Node.js to PATH if it exists ---
if exist "C:\Users\ashra\nodejs\node-v22.16.0-win-x64\node.exe" (
    set "PATH=C:\Users\ashra\nodejs\node-v22.16.0-win-x64;%PATH%"
)

:: --- Verify Node.js ---
"C:\Users\ashra\nodejs\node-v22.16.0-win-x64\node.exe" --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js found
) else (
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Node.js found in system PATH
    ) else (
        echo [ERROR] Node.js not found!
        echo         Install from https://nodejs.org or place portable version at:
        echo         C:\Users\ashra\nodejs\
        pause
        exit /b 1
    )
)

:: --- Verify Python venv ---
if exist "backend\venv\Scripts\python.exe" (
    echo [OK] Python venv found
) else (
    echo [ERROR] Python venv not found at backend\venv\
    echo         Run: python -m venv backend\venv
    pause
    exit /b 1
)

:: --- Check PostgreSQL ---
sc query postgresql-x64-17 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL service found
) else (
    echo [WARN] PostgreSQL service not detected - database may not work
)

echo.

:: --- Start Ollama (if not already running) ---
curl -s -o nul http://localhost:11434/api/tags 2>nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Ollama server...
    where ollama >nul 2>&1
    if %errorlevel% equ 0 (
        start /min "Ollama" ollama serve
        timeout /t 3 /nobreak >nul
        echo       Ollama started
    ) else (
        echo [WARN] Ollama not found - AI features will not work
        echo        Install from https://ollama.com
    )
) else (
    echo [1/3] Ollama already running
)

:: --- Start Backend ---
echo [2/3] Starting Backend (FastAPI :8000)...
start "Omnisage Backend" cmd /c "cd /d "%~dp0" && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 4 /nobreak >nul

:: --- Start Frontend ---
echo [3/3] Starting Frontend (Vite :5173)...
start "Omnisage Frontend" cmd /c "cd /d "%~dp0frontend" && "C:\Users\ashra\nodejs\node-v22.16.0-win-x64\node.exe" node_modules\.bin\vite"
timeout /t 4 /nobreak >nul

echo.
echo  ============================================
echo   ALL SERVICES STARTED!
echo  ============================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.

:: --- Open browser ---
start http://localhost:5173

echo  Press any key to close this launcher.
echo  (Services keep running in their own windows)
pause >nul
