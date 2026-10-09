import { Hono } from 'hono';
import type { Env } from '../index';

export const genresRoutes = new Hono<{ Bindings: Env }>();

genresRoutes.get('/', async (c) => {
  const db = c.env.DB;
  try {
    const result = await db.prepare(
      `SELECT g.id, g.name, g.slug, COUNT(bg.book_id) as book_count
       FROM genres g
       LEFT JOIN book_genres bg ON bg.genre_id = g.id
       GROUP BY g.id
       ORDER BY book_count DESC`
    ).all();

    return c.json({ genres: result.results || [] });
  } catch (e) {
    console.error('Genres list error:', e);
    return c.json({ error: 'Failed to fetch genres' }, 500);
  }
});
