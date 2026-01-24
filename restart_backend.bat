@echo off
setlocal
echo ==========================================
echo      Atlas Backend RESTART
echo ==========================================
echo.

echo [1] Killing any stuck node processes...
taskkill /F /IM node.exe /T 2>nul
echo.

echo [2] Starting BACKEND ONLY (Port 5000)...
echo (Your frontend is likely already running)
start "Atlas Backend (Groq)" /D server cmd /k "node groq_server.js"
echo Backend launched.
echo.
echo Please reload your browser page now.
pause
