@echo off
echo ===================================================
echo ⚠️  WARNING: This will completely destroy your database, 
echo clear all built files, and reset your environment 
echo to a blank slate!
echo ===================================================
set /p confirm="Are you sure you want to continue? (y/N): "

if /i "%confirm%" NEQ "y" (
    echo Cleanup cancelled.
    pause
    exit /b 1
)

echo 🛑 Stopping and removing Docker containers + volumes...
call docker compose down -v

echo 🗑️  Removing Next.js build cache...
IF EXIST ".next" rmdir /s /q .next

echo 🗑️  Removing Node modules and package-lock...
IF EXIST "node_modules" rmdir /s /q node_modules
IF EXIST "package-lock.json" del /f /q package-lock.json

echo 🗑️  (Optional) Removing .env configuration...
set /p env_confirm="Do you want to delete your current .env file to force reconfiguration? (y/N): "
if /i "%env_confirm%" EQU "y" (
    IF EXIST ".env" del /f /q .env
    echo ✅ .env file removed.
)

echo ===================================================
echo ✨ Cleanup complete! The environment is now a blank slate.
echo ➡️  Run deploy.bat to install everything from scratch.
echo ===================================================
pause
