@echo off
REM Milkshake dev server launcher (Windows).
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is not on PATH.
    echo Install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

if "%PORT%"=="" set PORT=8080

echo.
echo Starting Milkshake dev server on http://localhost:%PORT%/
echo (the root URL redirects to milkshake.html)
echo Press Ctrl+C to stop.
echo.

node server\server.js

endlocal
