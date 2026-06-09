@echo off
title Omnisage - Stopping All Services
color 0C

echo.
echo  ============================================
echo   OMNISAGE - Stopping all services...
echo  ============================================
echo.

:: Kill Python (backend)
taskkill /f /im python.exe >nul 2>&1
echo [x] Backend stopped

:: Kill Node (frontend)
taskkill /f /im node.exe >nul 2>&1
echo [x] Frontend stopped

echo.
echo  All services stopped.
echo  (Ollama and PostgreSQL left running as system services)
echo.
pause
