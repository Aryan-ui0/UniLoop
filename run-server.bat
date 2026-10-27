@echo off
REM ===================================================================
REM  UniLoop - one-click start
REM  Double-click this file to install anything missing, start the API
REM  (port 5000) and React (port 5173), and open the app in a browser.
REM  Close this window (or press Ctrl+C) to stop everything.
REM ===================================================================
title UniLoop
cd /d "%~dp0"

echo.
echo  ===== UniLoop =====
echo.

REM --- 1. Node.js must be installed ---
where node >nul 2>nul
if errorlevel 1 (
    echo  [X] Node.js is not installed.
    echo      Download the LTS version from https://nodejs.org and run this file again.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo  [OK] Node.js %%v

REM --- 2. server\.env must exist (MongoDB Atlas connection + JWT secret) ---
if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
    echo  [!] Created server\.env from the example file.
    echo.
    echo      Open server\.env in a text editor and fill in:
    echo        MONGO_URI   = your MongoDB Atlas connection string
    echo        JWT_SECRET  = any long random text
    echo      Then run this file again. See README.md for Atlas setup steps.
    echo.
    pause
    exit /b 1
)
findstr /c:"<username>" "server\.env" >nul
if not errorlevel 1 (
    echo  [!] server\.env still has the placeholder MONGO_URI.
    echo      Replace it with your MongoDB Atlas connection string, then run this file again.
    echo.
    pause
    exit /b 1
)
echo  [OK] server\.env found

REM --- 3. Install packages the first time (or if a folder was deleted) ---
if not exist "node_modules" goto install
if not exist "server\node_modules" goto install
if not exist "client\node_modules" goto install
echo  [OK] Packages already installed
goto start

:install
echo  [..] Installing packages (first run only, this can take a few minutes)...
call npm run install-all
if errorlevel 1 (
    echo.
    echo  [X] Installing packages failed. Check your internet connection and try again.
    pause
    exit /b 1
)
echo  [OK] Packages installed

:start
REM --- 4. Add the demo users and items if the database is empty ---
echo  [..] Connecting to the database...
call npm run seed:if-empty --prefix server --silent
if errorlevel 1 (
    echo.
    echo  [X] Could not connect to MongoDB. Check MONGO_URI in server\.env,
    echo      and that your IP address is allowed under Network Access in Atlas.
    pause
    exit /b 1
)

echo.
echo  Starting UniLoop...
echo    App:  http://localhost:5173
echo    API:  http://localhost:5000
echo.
echo  Close this window to stop the server.
echo.

REM Open the browser a few seconds from now, once the servers are up
start "" /min cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:5173"

call npm run dev

echo.
echo  UniLoop has stopped.
pause
