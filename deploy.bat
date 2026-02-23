@echo off
echo ===================================================
echo 🚀 Starting NexPayroll Windows Deployment Sequence...
echo ===================================================

:: 1. Check for .env file
IF NOT EXIST ".env" (
    echo ⚠️  No .env file found!
    IF EXIST ".env.example" (
        copy .env.example .env
        echo ✅ Copied .env.example to .env.
        echo 🛑 PLEASE CONFIGURE YOUR .env FILE BEFORE CONTINUING!
        echo Make sure to set your DATABASE_URL, NEXTAUTH_SECRET, etc.
        echo Once configured, re-run this script.
        pause
        exit /b 1
    ) ELSE (
        echo ❌ .env.example not found. Please create a .env file manually.
        pause
        exit /b 1
    )
)

echo ✅ Environment file (.env) found.

:: 2. Start PostgreSQL Database via Docker
echo 🐳 Starting PostgreSQL database container...
docker compose up -d

:: Wait a few seconds for PostgreSQL to accept connections
echo ⏳ Waiting 5 seconds for database to wake up...
timeout /t 5 /nobreak > NUL

:: 3. Install Node.js Dependencies
echo 📦 Installing Node.js dependencies...
call npm install --include=dev

:: 4. Apply Database Migrations
echo 🗄️  Applying database migrations (Prisma)...
call npx prisma migrate deploy
echo ⚙️  Generating Prisma Client...
call npx prisma generate

:: 5. Seed Initial Data
echo 🌱 Seeding database (Creating Admin if missing)...
call npm run prisma:seed

:: 6. Build the Application
echo 🏗️  Building the Next.js optimized production app...
call npm run build

echo ===================================================
echo 🎉 Deployment setup completed successfully!
echo ➡️  Start the application with: npm run start
echo ===================================================
pause
