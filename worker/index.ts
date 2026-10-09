import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { booksRoutes } from './routes/books';
import { genresRoutes } from './routes/genres';
import { configRoutes } from './routes/config';
import { healthRoutes } from './routes/health';
import { adminRoutes } from './routes/admin';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  ADMIN_TOKEN?: string;
  GOOGLE_BOOKS_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.route('/api/books', booksRoutes);
app.route('/api/genres', genresRoutes);
app.route('/api/config', configRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/admin', adminRoutes);

// 404 for unknown API routes
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

// Scheduled handler for cron triggers
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Import dynamically to avoid loading ingestion code on every request
    const { runScheduledIngestion } = await import('./ingestion/scheduler');
    ctx.waitUntil(runScheduledIngestion(env));
  },
};
