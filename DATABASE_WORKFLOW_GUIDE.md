# Database Migration and Deployment Workflow

This document outlines the strict protocol and industry best practices for updating the database schema in NexPayroll, ensuring zero data loss during both development and production deployments.

---

## 1. Frequently Asked Questions

### Do I need to perform the "Baseline" steps on a new Linux Server?
**NO.** The baselining process we performed was a **one-time fix** to resolve a mismatch on your local machine, where the database already had tables without any recorded migration history. 

Because we officially generated the `20260220194128_baseline` migration file, it is now part of your codebase (under `prisma/migrations/`). When you deploy to a fresh Linux server with an empty database, Prisma will execute that baseline SQL file automatically and build your tables from scratch exactly as intended.

### Is the automated database backup step still working?
**YES.** During the Maintenance Hub deployment bridge sequence, Prisma is never the first command to run. The exact sequence in `lib/deploy-sync.ts` is:
1. **Safety Database Backup**: `docker exec -t salary_postgres pg_dump ...` -> Outputs a `.sql` timestamped backup into the `/backups` folder on the server.
2. **Fetch Code**: `git pull`
3. **Install Dependencies**: `npm install`
4. **Apply Migrations**: `npx prisma migrate deploy`
5. **Rebuild Application**: `npm run build`

If a migration ever fails or corrupts data, you will always have an immediate snapshot of the data from 5 seconds prior waiting in the `/backups` folder.

---

## 2. Development Workflow (Making Schema Changes)

Whenever you add a new feature that requires a database change (e.g., adding a new column, creating a new table), you must follow these steps on your **LOCAL DEVELOPMENT MACHINE:**

1. **Update Schema**: Open `prisma/schema.prisma` and make your necessary model changes.
2. **Generate Migration**: Do **NOT** use `npx prisma db push`. Instead, tell Prisma to look at your changes and generate an SQL migration file:
   ```bash
   npx prisma migrate dev --name describe_your_change_here
   ```
   *Example: `npx prisma migrate dev --name add_employee_phone_number`*
3. **Verify Generation**: Prisma will apply the change to your local database and magically generate a new folder inside `prisma/migrations/` containing your `migration.sql` update query. It will also rebuild the Prisma Client.
4. **Commit to Git**: Commit both the updated `schema.prisma` file AND the newly generated `prisma/migrations/` folder.
   ```bash
   git add prisma/
   git commit -m "Added phone number field to employee schema"
   git push origin master
   ```

---

## 3. Production Deployment Workflow (Applying Updates Safely)

Now that you have committed a migration tracking file, your production database must safely apply it without overriding existing records. 

### Option A: Using the In-App Maintenance Hub (Recommended)
1. Navigate to the Admin Settings -> **Maintenance Hub** in your app.
2. Click **Sync and Update**.
3. *What happens automatically:* The system creates a backup, pulls your Git commit, and runs `npx prisma migrate deploy`. 
4. `migrate deploy` intelligently scans the `prisma/migrations` folder, realizes there is a new folder it hasn't seen before, and executes *only* that specific SQL file. Your existing tables and data are left entirely untouched.

### Option B: Manual Linux Server Deployment
If you are deploying updates manually from the server terminal instead of the Maintenance Hub:

1. **Access Server**: SSH into your Linux instance.
2. **Take Manual Backup (Optional Safety)**: 
   ```bash
   docker exec -t salary_postgres pg_dump -U postgres salary_mvp > "backups/manual_backup_$(date +%F).sql"
   ```
3. **Pull Code**:
   ```bash
   git pull origin master
   ```
4. **Install and Generate Migrations Safely**:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
   *(Notice we always use `deploy` here, never `dev` or `db push`. `deploy` strictly applies pending SQL files and does not attempt to drop tables unprompted).*
5. **Build and Restart**:
   ```bash
   npm run build
   # Restart your server process (e.g., PM2, systemctl, or npm start)
   ```

By adhering strictly to this cycle—`migrate dev` locally to generate the instructions, and `migrate deploy` on production to safely execute those instructions—you guarantee 100% data safety and a robust deployment pipeline.
