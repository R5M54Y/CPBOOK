import { Hono } from 'hono';
import type { Env } from '../index';

export const configRoutes = new Hono<{ Bindings: Env }>();

// GET /api/config — Load site configuration from D1
configRoutes.get('/', async (c) => {
  const db = c.env.DB;
  try {
    const row = await db.prepare(
      'SELECT config_json FROM site_configuration WHERE id = 1'
    ).first<{ config_json: string }>();

    if (!row) {
      return c.json(null, 404);
    }

    return c.json(JSON.parse(row.config_json));
  } catch (e) {
    console.error('Config load error:', e);
    return c.json({ error: 'Failed to load configuration' }, 500);
  }
});

// PUT /api/config — Save site configuration to D1
configRoutes.put('/', async (c) => {
  const db = c.env.DB;
  try {
    const body = await c.req.json();
    const configJson = JSON.stringify(body);

    await db.prepare(
      `INSERT INTO site_configuration (id, config_json, schema_version, updated_at)
       VALUES (1, ?, 1, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         config_json = excluded.config_json,
         updated_at = excluded.updated_at`
    ).bind(configJson).run();

    return c.json({ success: true });
  } catch (e) {
    console.error('Config save error:', e);
    return c.json({ error: 'Failed to save configuration' }, 500);
  }
});
