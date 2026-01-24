@echo off
setlocal
echo ==========================================
echo      Atlas Fixed Startup Script
echo ==========================================
echo.

echo [Step 1] Stopping old Node.js processes...
taskkill /F /IM node.exe /T 2>nul
echo Done.
echo.

echo [Step 2] Installing Backend Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    echo Please check your internet connection or node installation.
    pause
    exit /b
)
echo Done.
echo.

echo [Step 3] Starting Backend Server...
:: start "Title" /D "Path" Command
start "Atlas Backend (Port 5000)" /D . cmd /k "node index.js"
echo Backend launch command sent.
echo.

echo [Step 4] Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul
echo.

echo [Step 5] Starting Frontend...
cd ..
echo Running 'npm run dev'...
call npm run dev
