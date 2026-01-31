@echo off
title Aurem - AI Learning Platform
echo.
echo  ====================================
echo       AUREM - AI Learning Platform
echo  ====================================
echo.
echo Starting Aurem...
echo.

:: Start the backend server in a new window
echo [1/2] Starting Backend Server (Port 5010)...
start "Aurem Backend" cmd /k "cd /d %~dp0 && node server/index.js"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start the frontend dev server
echo [2/2] Starting Frontend (Port 8080)...
start "Aurem Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ====================================
echo Aurem is starting up!
echo.
echo Backend:  http://localhost:5010
echo Frontend: http://localhost:8080
echo ====================================
echo.
echo Press any key to open the app in your browser...
pause > nul

start http://localhost:8080
