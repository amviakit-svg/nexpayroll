#!/bin/bash
set -e

echo "⚠️  WARNING: This will completely destroy your database, clear all built files, and reset your environment to a blank slate!"
read -p "Are you sure you want to continue? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo "🛑 Stopping and removing Docker containers + volumes..."
docker compose down -v

echo "🗑️  Removing Next.js build cache..."
rm -rf .next

echo "🗑️  Removing Node modules and package-lock..."
rm -rf node_modules package-lock.json

echo "🗑️  (Optional) Removing .env configuration..."
read -p "Do you want to delete your current .env file to force reconfiguration? (y/N): " env_confirm
if [[ "$env_confirm" == "y" || "$env_confirm" == "Y" ]]; then
    rm -f .env
    echo "✅ .env file removed."
fi

echo "==================================================="
echo "✨ Cleanup complete! The environment is now a blank slate."
echo "➡️  Run ./deploy.sh to install everything from scratch."
echo "==================================================="
