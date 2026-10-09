import type { NormalizedBook } from '../providers/types';
import { normalizeTitle, normalizeAuthorName, normalizeIsbn, generateSlug, stripHtml } from '../normalization/normalize';

/**
 * Upsert a normalized book into D1, handling dedup, authors, genres, and source mapping.
 * Returns the canonical book ID.
 */
export async function upsertBook(db: D1Database, book: NormalizedBook): Promise<{
  bookId: number;
  action: 'inserted' | 'updated' | 'skipped';
}> {
  // 1. Check for existing source mapping (exact provider + external_id)
  const existingSource = await db.prepare(
    'SELECT book_id FROM book_sources WHERE provider = ? AND external_id = ?'
  ).bind(book.source.provider, book.source.externalId).first<{ book_id: number }>();

  if (existingSource) {
    // Update last_seen_at
    await db.prepare(
      `UPDATE book_sources SET last_seen_at = datetime('now'), updated_at = datetime('now')
       WHERE provider = ? AND external_id = ?`
    ).bind(book.source.provider, book.source.externalId).run();

    // Update book metadata if we have richer data
    await updateBookMetadata(db, existingSource.book_id, book);

    return { bookId: existingSource.book_id, action: 'updated' };
  }

  // 2. Check for ISBN match
  const cleanIsbn13 = book.isbn13 ? normalizeIsbn(book.isbn13) : null;
  const cleanIsbn10 = book.isbn10 ? normalizeIsbn(book.isbn10) : null;

  let matchedBookId: number | null = null;

  if (cleanIsbn13) {
    const isbn13Match = await db.prepare(
      'SELECT id FROM books WHERE isbn_13 = ?'
    ).bind(cleanIsbn13).first<{ id: number }>();
    if (isbn13Match) matchedBookId = isbn13Match.id;
  }

  if (!matchedBookId && cleanIsbn10) {
    const isbn10Match = await db.prepare(
      'SELECT id FROM books WHERE isbn_10 = ?'
    ).bind(cleanIsbn10).first<{ id: number }>();
    if (isbn10Match) matchedBookId = isbn10Match.id;
  }

  // 3. Conservative title+author match
  if (!matchedBookId && book.authors.length > 0) {
    const normTitle = normalizeTitle(book.title);
    const normAuthor = normalizeAuthorName(book.authors[0]);
    const titleMatch = await db.prepare(
      `SELECT id FROM books WHERE normalized_title = ? AND
       EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON ba.author_id = a.id
               WHERE ba.book_id = books.id AND a.normalized_name = ?)`
    ).bind(normTitle, normAuthor).first<{ id: number }>();
    if (titleMatch) matchedBookId = titleMatch.id;
  }

  if (matchedBookId) {
    // Add source mapping to existing book
    await addSourceMapping(db, matchedBookId, book.source);
    await updateBookMetadata(db, matchedBookId, book);
    return { bookId: matchedBookId, action: 'updated' };
  }

  // 4. Insert new book
  const slug = generateSlug(book.title);
  const normTitle = normalizeTitle(book.title);
  const description = book.description ? stripHtml(book.description) : null;

  const result = await db.prepare(
    `INSERT INTO books (title, normalized_title, subtitle, description, language,
     published_date, publisher, page_count, isbn_10, isbn_13, cover_url,
     primary_author, slug, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    book.title, normTitle, book.subtitle || null, description,
    book.language || null, book.publishedDate || null,
    book.publisher || null, book.pageCount || null,
    cleanIsbn10, cleanIsbn13, book.coverUrl || null,
    book.authors[0] || null, slug
  ).run();

  const bookId = result.meta.last_row_id as number;

  // Insert authors
  for (let i = 0; i < book.authors.length; i++) {
    const authorId = await upsertAuthor(db, book.authors[i]);
    await db.prepare(
      'INSERT OR IGNORE INTO book_authors (book_id, author_id, author_order) VALUES (?, ?, ?)'
    ).bind(bookId, authorId, i).run();
  }

  // Insert genres
  for (const genreName of book.genres) {
    const genreId = await upsertGenre(db, genreName);
    await db.prepare(
      'INSERT OR IGNORE INTO book_genres (book_id, genre_id, source) VALUES (?, ?, ?)'
    ).bind(bookId, genreId, book.source.provider).run();
  }

  // Add source mapping
  await addSourceMapping(db, bookId, book.source);

  return { bookId, action: 'inserted' };
}

async function upsertAuthor(db: D1Database, name: string): Promise<number> {
  const normalized = normalizeAuthorName(name);
  const existing = await db.prepare(
    'SELECT id FROM authors WHERE normalized_name = ?'
  ).bind(normalized).first<{ id: number }>();

  if (existing) return existing.id;

  const result = await db.prepare(
    `INSERT INTO authors (name, normalized_name, created_at, updated_at)
     VALUES (?, ?, datetime('now'), datetime('now'))`
  ).bind(name, normalized).run();

  return result.meta.last_row_id as number;
}

async function upsertGenre(db: D1Database, name: string): Promise<number> {
  const slug = generateSlug(name);
  const existing = await db.prepare(
    'SELECT id FROM genres WHERE slug = ?'
  ).bind(slug).first<{ id: number }>();

  if (existing) return existing.id;

  const result = await db.prepare(
    'INSERT INTO genres (name, slug) VALUES (?, ?)'
  ).bind(name, slug).run();

  return result.meta.last_row_id as number;
}

async function addSourceMapping(
  db: D1Database,
  bookId: number,
  source: NormalizedBook['source']
): Promise<void> {
  await db.prepare(
    `INSERT INTO book_sources (book_id, provider, external_id, source_url, source_updated_at, last_seen_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
     ON CONFLICT(provider, external_id) DO UPDATE SET
       book_id = excluded.book_id,
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`
  ).bind(
    bookId, source.provider, source.externalId,
    source.sourceUrl || null, source.sourceUpdatedAt || null
  ).run();
}

async function updateBookMetadata(db: D1Database, bookId: number, book: NormalizedBook): Promise<void> {
  // Only overwrite null/empty fields — never replace good data with null
  const existing = await db.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!existing) return;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (!existing.description && book.description) {
    updates.push('description = ?');
    values.push(stripHtml(book.description));
  }
  if (!existing.cover_url && book.coverUrl) {
    updates.push('cover_url = ?');
    values.push(book.coverUrl);
  }
  if (!existing.page_count && book.pageCount) {
    updates.push('page_count = ?');
    values.push(book.pageCount);
  }
  if (!existing.publisher && book.publisher) {
    updates.push('publisher = ?');
    values.push(book.publisher);
  }
  if (!existing.isbn_13 && book.isbn13) {
    updates.push('isbn_13 = ?');
    values.push(normalizeIsbn(book.isbn13));
  }
  if (!existing.isbn_10 && book.isbn10) {
    updates.push('isbn_10 = ?');
    values.push(normalizeIsbn(book.isbn10));
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    await db.prepare(
      `UPDATE books SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values, bookId).run();
  }
}
