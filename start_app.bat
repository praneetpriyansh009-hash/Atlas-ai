@echo off
setlocal
echo ==========================================
echo      Atlas Application Startup Script
echo ==========================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Force install if node_modules missing
if not exist "node_modules\" (
    echo [STATUS] node_modules folder is missing. Installing dependencies now...
    echo (This will take a minute. Please wait.)
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b
    )
) else (
    echo [STATUS] Dependencies found (node_modules exists).
)

echo.
echo [STATUS] Starting Application...
echo.
echo If successful, browser will open at: http://localhost:8080
echo.

:: Start backend server in a new window
echo [STATUS] Starting Backend Server on port 5000...
start "Atlas Backend" cmd /c "cd server && npm install && node index.js"

:: Wait for server to initialize
timeout /t 3 /nobreak >nul

:: Run the Vite dev server
echo [STATUS] Starting Frontend on port 8080...
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 'npm run dev' failed.
    echo 1. Check if another program is using port 8080.
    echo 2. Try deleting 'node_modules' and running this script again.
)

pause
