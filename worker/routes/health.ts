import { Hono } from 'hono';
import type { Env } from '../index';

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const checks: Record<string, string> = {
    worker: 'ok',
    database: 'unknown',
    config: 'unknown',
    lastIngestion: 'unknown',
  };

  try {
    // DB connectivity
    const dbCheck = await db.prepare('SELECT 1 as ok').first();
    checks.database = dbCheck ? 'ok' : 'error';

    // Config status
    const config = await db.prepare(
      'SELECT config_json FROM site_configuration WHERE id = 1'
    ).first();
    checks.config = config ? 'configured' : 'not_configured';

    // Last ingestion
    const lastJob = await db.prepare(
      `SELECT status, finished_at, provider, records_inserted, records_updated
       FROM ingestion_jobs ORDER BY id DESC LIMIT 1`
    ).first();
    if (lastJob) {
      checks.lastIngestion = `${lastJob.provider}: ${lastJob.status} at ${lastJob.finished_at || 'in progress'}`;
    } else {
      checks.lastIngestion = 'never';
    }
  } catch (e) {
    checks.database = 'error';
    console.error('Health check error:', e);
  }

  const status = checks.database === 'ok' ? 200 : 503;
  return c.json({
    status: checks.database === 'ok' ? 'healthy' : 'degraded',
    environment: c.env.ENVIRONMENT || 'unknown',
    checks,
    timestamp: new Date().toISOString(),
  }, status);
});
