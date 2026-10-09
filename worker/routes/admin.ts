import { Hono } from 'hono';
import type { Env } from '../index';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Auth middleware
adminRoutes.use('*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const adminToken = c.env.ADMIN_TOKEN;

  if (!adminToken) {
    return c.json({ error: 'Admin access not configured' }, 503);
  }

  if (!token || token !== adminToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

// POST /api/admin/ingestion/run - Trigger manual ingestion
adminRoutes.post('/ingestion/run', async (c) => {
  try {
    const { runScheduledIngestion } = await import('../ingestion/scheduler');
    c.executionCtx.waitUntil(runScheduledIngestion(c.env));
    return c.json({ success: true, message: 'Ingestion triggered' });
  } catch (e) {
    console.error('Manual ingestion error:', e);
    return c.json({ error: 'Failed to trigger ingestion' }, 500);
  }
});

// GET /api/admin/ingestion/status - Recent ingestion jobs
adminRoutes.get('/ingestion/status', async (c) => {
  const db = c.env.DB;
  try {
    const jobs = await db.prepare(
      `SELECT id, provider, status, started_at, finished_at,
              records_fetched, records_inserted, records_updated,
              records_skipped, records_failed, error_summary
       FROM ingestion_jobs ORDER BY id DESC LIMIT 20`
    ).all();

    return c.json({ jobs: jobs.results || [] });
  } catch (e) {
    console.error('Ingestion status error:', e);
    return c.json({ error: 'Failed to fetch status' }, 500);
  }
});

// GET /api/admin/ingestion/errors - Recent ingestion errors
adminRoutes.get('/ingestion/errors', async (c) => {
  const db = c.env.DB;
  try {
    const errors = await db.prepare(
      `SELECT ie.id, ie.job_id, ie.provider, ie.error_type, ie.message, ie.external_id, ie.created_at
       FROM ingestion_errors ie
       ORDER BY ie.id DESC LIMIT 50`
    ).all();

    return c.json({ errors: errors.results || [] });
  } catch (e) {
    console.error('Ingestion errors fetch error:', e);
    return c.json({ error: 'Failed to fetch errors' }, 500);
  }
});
