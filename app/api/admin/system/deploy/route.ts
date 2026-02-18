import { NextResponse } from 'next/server';
import {
    getDeploymentCommands,
    executeStep,
    verifyDeploymentAccess,
    IS_PRODUCTION
} from '@/lib/deploy-sync';
import { requireAdmin } from '@/lib/session';

/**
 * POST /api/admin/system/deploy
 * Securely triggers a deployment sync on the production system.
 */
export async function POST(req: Request) {
    try {
        // 1. Initial Authentication (Standard Admin Check)
        // This ensures random users can't touch this even if they have the secret.
        await requireAdmin();

        // 2. Secret Verification (The "Bridge" Security)
        const { secret } = await req.json();
        if (!verifyDeploymentAccess(secret)) {
            return NextResponse.json({ error: 'Invalid deployment secret' }, { status: 403 });
        }

        // 3. Safety Check: Only allow syncing on dedicated production environments
        if (!IS_PRODUCTION) {
            return NextResponse.json({
                error: 'Deployment Bridge can only be triggered on an environment with APP_ENV=production'
            }, { status: 400 });
        }

        const commands = getDeploymentCommands();
        const results = [];

        // 4. Sequential Execution
        for (const step of commands) {
            const result = await executeStep(step.label, step.command);
            results.push({
                step: step.label,
                id: step.id,
                success: result.success,
                details: result.details
            });

            if (!result.success) {
                // Stop the chain if any step fails
                return NextResponse.json({
                    error: `Step failed: ${step.label}`,
                    results
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            message: 'System successfully synchronized with Dev',
            results
        });

    } catch (error: any) {
        console.error('[DEPLOY_API_ERROR]', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

/**
 * GET /api/admin/system/deploy
 * Returns environmental status for the Bridge UI.
 */
export async function GET() {
    try {
        await requireAdmin();
        return NextResponse.json({
            isProduction: IS_PRODUCTION,
            hasSecret: !!process.env.DEPLOYMENT_SECRET,
            platform: process.platform
        });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
