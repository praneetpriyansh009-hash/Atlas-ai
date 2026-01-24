@echo off
echo [STATUS] Stopping old processes...
taskkill /F /IM node.exe /T 2>nul

echo [STATUS] Installing Server Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Server npm install failed!
    pause
    exit /b
)

echo [STATUS] Starting Backend (Port 5000)...
start "Atlas Backend" cmd /k "node index.js"

echo [STATUS] Waiting for backend...
timeout /t 5 /nobreak >nul

echo [STATUS] Starting Frontend...
cd ..
npm run dev
