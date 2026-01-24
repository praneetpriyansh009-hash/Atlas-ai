@echo off
setlocal
echo ==========================================
echo      Atlas GROQ MIGRATION STARTUP
echo ==========================================
echo.

echo [1] Killing old processes...
taskkill /F /IM node.exe /T 2>nul
echo.

echo [2] Starting GROQ-ONLY Backend...
start "Atlas Backend (Groq)" /D server cmd /k "node groq_server.js"
echo Backend launched.
echo.

echo [3] Starting Frontend...
call npm run dev
