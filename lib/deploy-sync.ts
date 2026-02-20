import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Security: The Deployment Secret must match between Dev and Production systems.
 */
export const DEPLOYMENT_SECRET = process.env.DEPLOYMENT_SECRET;

/**
 * Environment Identification
 */
export const IS_PRODUCTION = process.env.APP_ENV === 'production';
export const IS_DEVELOPMENT = process.env.APP_ENV !== 'production';

export interface DeploymentLog {
    timestamp: string;
    action: string;
    status: 'SUCCESS' | 'ERROR';
    details: string;
}

/**
 * Core execution engine for deployment commands
 */
export async function executeStep(label: string, command: string) {
    console.log(`[DEPLOY] Executing: ${label}...`);
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            env: { ...process.env, CI: 'true' } // Avoid interactive prompts
        });

        if (stderr && !stderr.toLowerCase().includes('warning') && !stderr.toLowerCase().includes('already up to date')) {
            console.warn(`[DEPLOY] Warning/Stderr in ${label}:`, stderr);
        }

        return { success: true, details: stdout || stderr };
    } catch (error: any) {
        console.error(`[DEPLOY] Error in ${label}:`, error.message);
        return {
            success: false,
            details: error.stderr || error.message,
            error: error.message
        };
    }
}

/**
 * Generates the correct commands based on the OS (Windows vs Linux)
 */
export function getDeploymentCommands() {
    const isWindows = process.platform === 'win32';
    const backupFolder = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = isWindows
        ? `backups\\auto_backup_${timestamp}.sql`
        : `backups/auto_backup_${timestamp}.sql`;

    return [
        {
            id: 'backup',
            label: 'Safety Database Backup',
            command: `docker exec -t salary_postgres pg_dump -U postgres salary_mvp > "${backupFile}"`
        },
        {
            id: 'pull',
            label: 'Fetching Latest Code',
            command: 'git pull origin master'
        },
        {
            id: 'install',
            label: 'Installing Dependencies',
            command: 'npm install --include=dev'
        },
        {
            id: 'migrate',
            label: 'Applying Database Migrations',
            command: 'npx prisma migrate deploy'
        },
        {
            id: 'build',
            label: 'Rebuilding Optimized App',
            command: 'npm run build'
        },
        {
            id: 'prune',
            label: 'Cleaning Development Cruft',
            command: 'npm prune --production'
        }
    ];
}

/**
 * Utility to verify if the incoming deployment request is authorized
 */
export function verifyDeploymentAccess(secret: string | null) {
    if (!DEPLOYMENT_SECRET) {
        console.error('[DEPLOY] Security Failure: DEPLOYMENT_SECRET not set in .env');
        return false;
    }
    return secret === DEPLOYMENT_SECRET;
}
