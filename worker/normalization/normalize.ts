/**
 * Text normalization utilities for book metadata and deduplication.
 */

/** Normalize a title for comparison: lowercase, strip articles, collapse whitespace. */
export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize an author name for comparison. */
export function normalizeAuthorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generate a URL-safe slug from a title. */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Normalize an ISBN by stripping hyphens and spaces. Returns null for empty/invalid. */
export function normalizeIsbn(isbn: string | null | undefined): string | null {
  if (!isbn) return null;
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length !== 10 && clean.length !== 13) return null;
  return clean;
}

/** Validate an ISBN-13 checksum. */
export function isValidIsbn13(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!clean || clean.length !== 13 || !/^\d{13}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(clean[12]);
}

/** Validate an ISBN-10 checksum. */
export function isValidIsbn10(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!clean || clean.length !== 10 || !/^\d{9}[\dXx]$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }
  const last = clean[9].toUpperCase();
  sum += last === 'X' ? 10 : parseInt(last);
  return sum % 11 === 0;
}

/**
 * Strip HTML tags from a description string.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
