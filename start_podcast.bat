@echo off
setlocal
echo ==========================================
echo      Atlas AI Podcast Studio Startup
echo ==========================================
echo.

echo [1] Ensuring no old processes are conflicting...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2] Starting AI Backend (Port 5002)...
start "Atlas AI Backend" /D server cmd /k "node index.js"
echo Backend warming up...
timeout /t 3 /nobreak >nul

echo [3] Starting Frontend (Vite)...
echo.
echo Launching...
call npm run dev
