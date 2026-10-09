import { Hono } from 'hono';
import type { Env } from '../index';

export const booksRoutes = new Hono<{ Bindings: Env }>();

// GET /api/books - List books with pagination, search, and genre filtering
booksRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10)));
  const search = c.req.query('q')?.trim() || '';
  const genre = c.req.query('genre')?.trim() || '';
  const offset = (page - 1) * pageSize;

  try {
    let countSql = 'SELECT COUNT(*) as total FROM books b';
    let listSql = `SELECT b.id, b.title, b.subtitle, b.primary_author, b.cover_url, b.published_date, b.slug FROM books b`;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Search filter
    if (search) {
      conditions.push('(b.normalized_title LIKE ? OR b.primary_author LIKE ?)');
      const searchTerm = `%${search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Genre filter
    if (genre) {
      conditions.push('EXISTS (SELECT 1 FROM book_genres bg JOIN genres g ON bg.genre_id = g.id WHERE bg.book_id = b.id AND g.slug = ?)');
      params.push(genre);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countSql += where;
      listSql += where;
    }

    listSql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';

    // Count query
    const countResult = await db.prepare(countSql).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // List query
    const listResult = await db.prepare(listSql).bind(...params, pageSize, offset).all();
    const books = listResult.results || [];

    return c.json({
      books,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error('Books list error:', e);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

// GET /api/books/:id - Book detail with authors, genres, sources
booksRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid book ID' }, 400);
  }

  try {
    // Get book
    const book = await db.prepare(
      'SELECT * FROM books WHERE id = ?'
    ).bind(id).first();

    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }

    // Get authors
    const authorsResult = await db.prepare(
      `SELECT a.id, a.name FROM authors a
       JOIN book_authors ba ON ba.author_id = a.id
       WHERE ba.book_id = ?
       ORDER BY ba.author_order`
    ).bind(id).all();

    // Get genres
    const genresResult = await db.prepare(
      `SELECT g.id, g.name, g.slug FROM genres g
       JOIN book_genres bg ON bg.genre_id = g.id
       WHERE bg.book_id = ?`
    ).bind(id).all();

    // Get sources
    const sourcesResult = await db.prepare(
      `SELECT provider, external_id, source_url FROM book_sources
       WHERE book_id = ?`
    ).bind(id).all();

    return c.json({
      ...book,
      authors: authorsResult.results || [],
      genres: genresResult.results || [],
      sources: sourcesResult.results || [],
    });
  } catch (e) {
    console.error('Book detail error:', e);
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
});
