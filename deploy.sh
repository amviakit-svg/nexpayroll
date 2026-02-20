#!/bin/bash
set -e

echo "==================================================="
echo "🚀 Starting NexPayroll Linux Deployment Sequence..."
echo "==================================================="

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Copied .env.example to .env."
        
        # Optionally generate a quick NEXTAUTH_SECRET via openssl if available
        if command -v openssl &> /dev/null; then
            SECRET=$(openssl rand -base64 32)
            sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|g" .env
            echo "🔐 Auto-generated NEXTAUTH_SECRET in .env."
        fi

        echo "🛑 PLEASE CONFIGURE YOUR .env FILE BEFORE CONTINUING!"
        echo "Make sure to set your DATABASE_URL and any other specific variables."
        echo "Once configured, re-run this script."
        exit 1
    else
        echo "❌ .env.example not found. Please create a .env file manually."
        exit 1
    fi
fi

echo "✅ Environment file (.env) found."

# 2. Start PostgreSQL Database via Docker
echo "🐳 Starting PostgreSQL database container..."
docker compose up -d

# Wait a few seconds for PostgreSQL to accept connections
echo "⏳ Waiting for database to wake up..."
sleep 5

# 3. Install Dependencies
echo "📦 Installing Node.js dependencies..."
npm install --include=dev

# 4. Apply Database Migrations
echo "🗄️  Applying database migrations (Prisma)..."
npx prisma migrate deploy

# 5. Seed Initial Data
echo "🌱 Seeding database (Creating Admin if missing)..."
npm run prisma:seed

# 6. Build the Application
echo "🏗️  Building the Next.js optimized production app..."
npm run build

# 7. Prune Development Tools
echo "🧹 Removing development tools (Pruning)..."
npm prune --production

echo "==================================================="
echo "🎉 Deployment setup completed successfully!"
echo "➡️  Start the application with: npm run start"
echo ""
echo "💡 Tip for Linux Production:"
echo "   It's highly recommended to run this using PM2 to keep it alive in the background:"
echo "   1. npm install -g pm2"
echo "   2. pm2 start npm --name 'nexpayroll' -- start"
echo "   3. pm2 save"
echo "==================================================="
