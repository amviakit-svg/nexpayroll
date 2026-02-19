# Deployment & Maintenance Guide - NexPayroll

This document outlines the standard procedures for backing up your database, applying schema changes (migrations), and deploying updates to the application.

## 1. Database Backup

Before making any changes or deploying new versions, **always back up your data**.

### Easy Backup & Share
The simplest way to export your data for sharing is to use the **`Run-NexPayroll.bat`** file:
1. Select **Option 3: Backup Database**.
2. A `.sql` file will be created in the `backups/` folder.
3. Share this `.sql` file with the other system/developer.

### Manual One-Liner Backup Command
Run this from the project root:

```bash
# Create backups directory if it doesn't exist
mkdir -p backups

# Dump the database to a SQL file with today's date
docker exec -t salary_postgres pg_dump -U postgres salary_mvp > backups/backup_$(date +%F_%H-%M-%S).sql
```

**Verify:** Check the `backups/` folder to ensure the file was created and has content (size > 0).

---

## 2. Making Database Changes (Development)

When you need to modify the database structure (e.g., add a new column or table):

1.  **Modify the Schema:**
    Edit `prisma/schema.prisma` to reflect your desired changes.

2.  **Create a Migration:**
    Run the following command to generate a migration file and apply it locally:
    ```bash
    npx prisma migrate dev --name <descriptive_name>
    # Example: npx prisma migrate dev --name add_phone_number
    ```

    *This will create a new SQL file in `prisma/migrations/` and update your local database.*

3.  **Commit Changes:**
    Commit the new migration files along with your code changes.
    ```bash
    git add .
    git commit -m "feat: added phone number to user schema"
    ```

---

## 3. Deploying Updates (Production)

When you are ready to apply changes to the running application:

### Step 1: Stop the Running App
If the app is running (e.g., in a terminal or via PM2), stop it first.
- **Terminal:** `Ctrl+C`
- **PM2:** `pm2 stop nexpayroll`

### Step 2: Get Latest Code
Pull the latest changes from your repository (if applicable):
```bash
git pull
```

### Step 3: Install Dependencies
Ensure all new packages are installed:
```bash
npm install
```

### Step 4: Backup the Database
**Crucial Step!** Run the backup command from Section 1.

### Step 5: Apply Database Migrations
Update the production database schema to match the new code:
```bash
npx prisma migrate deploy
```
*Note: This command only applies pending migrations. It will warn you if there are conflicts.*

### Step 6: Rebuild the Application
Build the optimized production version:
```bash
npm run build
```

### Step 7: Restart the App
Start the application again:
```bash
npm start
# OR if using PM2:
# pm2 restart nexpayroll
```

### Update Cycle Summary
| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Develop** | `npm run dev` | Real-time updates as you code. |
| **Publish** | `npm run build` | Saves your code into a "snapshot". |
| **Run Live** | `npm start` | Runs the last "snapshot" saved. |

---

## Troubleshooting

- **Migration Failed?**
  If `npx prisma migrate deploy` fails, check the error message. It usually means the database state has drifted. You may need to manually resolve conflicts or restore from backup.
  
- **App Crashing?**
  Check logs for errors:
  ```bash
  # If running directly: Look at terminal output
  # If using PM2: pm2 logs nexpayroll
  ```

- **Need to Restore?**
  To restore a backup (WARNING: Overwrites current data):
  ```bash
  cat backups/your_backup_file.sql | docker exec -i salary_postgres psql -U postgres salary_mvp
  ```

- **"Could not find a production build"?**
  If you get this error while running `npm start`, it means you haven't built the app yet. Run:
  ```bash
  npm run build
  npm start
  ```
  *Note: For development, use `npm run dev` instead.*

---

## 4. Linux First-Time Setup Guide

Follow these steps to deploy NexPayroll on a fresh Linux server (Ubuntu/Debian recommended).

### Phase 1: Prerequisites
Run these commands to install Docker and Node.js:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js (Version 20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Phase 2: Project Setup
```bash
# Clone the project (replace with your repo URL)
git clone <your-repo-url> nexpayroll
cd nexpayroll

# Install dependencies
npm install

# Setup Environment
cp .env.example .env
# EDIT .env to set your NEXTAUTH_SECRET and production URL
nano .env
```

### Phase 3: Start Services
```bash
# Start Database
docker compose up -d

# Initialize Database (Prisma)
npx prisma migrate deploy
npx prisma db seed

# Build and Start
npm run build
npm start # OR use PM2 for background process
```

### Phase 4: Keeping it Running (PM2)
```bash
sudo npm install -g pm2
pm2 start npm --name "nexpayroll" -- start
pm2 save
pm2 startup
```

