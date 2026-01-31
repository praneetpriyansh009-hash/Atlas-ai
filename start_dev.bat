@echo off
title Aurem - DEV MODE (Unlimited)
echo.
echo  ========================================
echo   AUREM - DEV MODE (All Limits Bypassed)
echo  ========================================
echo.
echo Starting Aurem in DEVELOPMENT MODE...
echo All subscription limits are DISABLED!
echo.

:: Set DEV_MODE environment variable for this session
set VITE_DEV_MODE=true
set VITE_DEFAULT_TIER=pro

:: Start the backend server in a new window
echo [1/2] Starting Backend Server (Port 5010)...
start "Aurem Backend [DEV]" cmd /k "cd /d %~dp0 && node server/index.js"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start the frontend dev server with DEV_MODE
echo [2/2] Starting Frontend in DEV MODE (Port 8080)...
start "Aurem Frontend [DEV]" cmd /k "cd /d %~dp0 && set VITE_DEV_MODE=true && set VITE_DEFAULT_TIER=pro && npm run dev"

echo.
echo ========================================
echo DEV MODE ACTIVE - ALL LIMITS BYPASSED!
echo.
echo Backend:  http://localhost:5010
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to open the app in your browser...
pause > nul

start http://localhost:8080
