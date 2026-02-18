@echo off
TITLE NexPayroll Unified Tool
SETLOCAL EnableDelayedExpansion

:MENU
cls
echo ==========================================
echo       NexPayroll Management Tool
echo ==========================================
echo.
echo  1. Start Application (Database + Web App)
echo  2. Run Maintenance: Reset Monthly Balances
echo  3. Backup Database (to share with others)
echo  4. Restore Database (from a backup file)
echo  5. Clean & Restart (Fixes UI/404 Errors)
echo  6. Regenerate All Payslips (New Design)
echo  7. Exit
echo.
echo ==========================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto START_APP
if "%choice%"=="2" goto RESET_BALANCES
if "%choice%"=="3" goto BACKUP_DB
if "%choice%"=="4" goto RESTORE_DB
if "%choice%"=="5" goto CLEAN_RESTART
if "%choice%"=="6" goto REGENERATE_PAYSLIPS
if "%choice%"=="7" exit
goto MENU

:START_APP
echo.
echo [INFO] Starting Application...
echo.
cd /d "%~dp0"
if not exist "node_modules\" (
    echo [ERROR] node_modules not found. Please run 'npm install' first.
    pause
    goto MENU
)
if not exist ".env" (
    echo [WARNING] .env file not found. Copying from .env.example...
    copy .env.example .env
)
echo [1/3] Starting PostgreSQL...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Docker Compose failed to start. Ensure Docker Desktop is running.
)
timeout /t 3 /nobreak > nul
netstat -an | findstr "5432" | findstr "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database is NOT running on port 5432.
    pause
    goto MENU
)
echo [2/3] Starting NexPayroll Dev Server...
start /b npm run dev
echo [3/3] Waiting for server (10s)...
timeout /t 10 /nobreak > nul
start http://localhost:3000
echo.
echo [SUCCESS] Server is running. Press Ctrl+C in this window to stop later.
pause
goto MENU

:RESET_BALANCES
echo.
echo [INFO] Resetting Monthly Balances...
cd /d "%~dp0"
npm run leave:reset-balances
echo.
pause
goto MENU

:BACKUP_DB
echo.
echo [INFO] Exporting Database...
cd /d "%~dp0"
if not exist "backups" mkdir backups
set filename=backups\nexpayroll_backup_%date:~10,4%%date:~4,2%%date:~7,2%.sql
docker exec -t salary_postgres pg_dump -U postgres salary_mvp > "!filename!"
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database exported to: !filename!
    echo [INFO] You can now share this file with anyone.
) else (
    echo [ERROR] Export failed. Is the database running? (Choice 1)
)
pause
goto MENU

:RESTORE_DB
echo.
echo [INFO] Restoring Database...
cd /d "%~dp0"
set /p backupfile="Enter the full path or filename of the .sql file: "
if not exist "!backupfile!" (
    echo [ERROR] File not found: !backupfile!
    pause
    goto MENU
)
echo [WARNING] This will OVERWRITE your current data.
set /p confirm="Are you sure? (y/n): "
if /i "!confirm!" neq "y" goto MENU

docker exec -i salary_postgres psql -U postgres salary_mvp < "!backupfile!"
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database restored from !backupfile!
) else (
    echo [ERROR] Restore failed. Is the database running? (Choice 1)
)
pause
goto MENU

:CLEAN_RESTART
echo.
echo [INFO] Performing Deep Cleanup...
echo [1/2] Deleting .next build cache...
if exist ".next" rmdir /s /q ".next"
echo [2/2] Deleting node_modules cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo.
echo [SUCCESS] Cleanup complete.
echo [INFO] Starting application fresh...
goto START_APP

:REGENERATE_PAYSLIPS
echo.
echo [INFO] Regenerating All Submitted Payslips...
echo [INFO] This will apply the NEW professional layout to all existing files.
cd /d "%~dp0"
npm run payroll:regenerate-pdfs
echo.
echo [SUCCESS] All payslips have been updated.
pause
goto MENU
