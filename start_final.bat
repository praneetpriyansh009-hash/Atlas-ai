@echo off
setlocal
echo ==========================================
echo      Atlas FINAL REPAIR & STARTUP
echo ==========================================
echo.

echo [1/4] Force killing old processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo Done.
echo.

echo [2/4] UPDATING AI SDK (Critical Fix)...
cd server
call npm install @google/generative-ai@latest
if %errorlevel% neq 0 (
    echo [WARNING] Update might have failed. trying to continue...
)
echo Done.
echo.

echo [3/4] Starting FIXED Backend (Main)...
start "Atlas Backend (Port 5010)" /D . cmd /k "node index.js"
echo Backend launched on Port 5010.
echo.

echo [4/4] Starting Frontend...
cd ..
call npm run dev
