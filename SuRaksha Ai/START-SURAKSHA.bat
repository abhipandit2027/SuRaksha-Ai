@echo off
chcp 65001 >nul
title SuRaksha AI - Development Server

echo ========================================
echo   SuRaksha AI - Safety Intelligence Hub
echo   Detect. Assess. Act.
echo ========================================
echo.

cd /d "%~dp0mind-my-safety-ai-main\mind-my-safety-ai-main"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Installing npm dependencies (this may take a few minutes)...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo [2/2] Starting development server...
echo.
echo The application will be available at:
echo   Local:    http://localhost:8080
echo   Network:  http://0.0.0.0:8080
echo.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

call node run-vite.mjs

echo.
echo Server stopped.
pause
