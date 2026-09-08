@echo off
chcp 65001 >nul
title SuRaksha AI - Build Production Version

echo ========================================
echo   SuRaksha AI - Production Build
echo ========================================
echo.

cd /d "%~dp0mind-my-safety-ai-main\mind-my-safety-ai-main"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo [2/2] Building production version...
echo.
call "%ProgramFiles%\nodejs\npm.cmd" run build

echo.
if errorlevel 1 (
    echo ERROR: Build failed.
) else (
    echo ========================================
    echo   Build completed successfully!
    echo   Output in: dist\ folder
    echo.
    echo   To preview the build, run:
    echo     npm run preview
    echo ========================================
)
pause
