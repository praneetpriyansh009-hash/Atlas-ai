@echo off
setlocal
echo ==========================================
echo      Atlas FAILSAFE Startup Script
echo ==========================================
echo.
echo [1] Killing old processes...
taskkill /F /IM node.exe /T 2>nul
echo.

echo [2] Installing Backend Dependencies (Quick)...
cd server
if not exist "node_modules\" call npm install

echo [3] Starting STANDALONE Backend (No Database)...
start "Atlas Backend (Standalone)" /D . cmd /k "node standalone_server.js"
echo Backend launched in new window.
echo.

echo [4] Starting Frontend...
cd ..
call npm run dev
