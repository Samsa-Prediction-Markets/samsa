@echo off
title Samsa Prediction Markets Server
echo.
echo ========================================
echo    SAMSA PREDICTION MARKETS
echo ========================================
echo.
echo Starting server...
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

:: Start the server and open browser
echo Server starting on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

:: Open browser after a short delay (gives server time to start)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001"

:: Run the server
node server.js

