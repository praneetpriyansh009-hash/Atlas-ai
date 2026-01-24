@echo off
setlocal
echo ==========================================
echo      Atlas ULTIMATE STARTUP (Groq)
echo ==========================================
echo.

echo [1] Cleaning up old processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2] Starting BACKEND (Port 5000)...
start "Atlas Backend" /D server cmd /k "node groq_server.js"
echo Backend launched in new window.
echo.

echo [3] Starting FRONTEND (Port 8080)...
echo Launching Vite...
call npm run dev
