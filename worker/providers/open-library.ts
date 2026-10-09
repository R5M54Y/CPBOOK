import type { ProviderAdapter, ProviderHealth, SearchParams, SearchResult, NormalizedBook } from './types';

/**
 * Open Library provider adapter.
 * Uses the official Open Library Search API: https://openlibrary.org/dev/docs/api/search
 * No API key required.
 */
export class OpenLibraryAdapter implements ProviderAdapter {
  readonly name = 'open_library';
  readonly requiresApiKey = false;

  private readonly baseUrl = 'https://openlibrary.org';
  private readonly userAgent = 'CPABOOK/1.0 (https://github.com/R5M54Y/CPBOOK)';

  async checkHealth(): Promise<ProviderHealth> {
    try {
      const res = await fetch(`${this.baseUrl}/search.json?q=test&limit=1`, {
        headers: { 'User-Agent': this.userAgent },
      });
      if (res.ok) return { status: 'ok' };
      return { status: 'degraded', message: `HTTP ${res.status}` };
    } catch (e) {
      return { status: 'unavailable', message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const url = new URL(`${this.baseUrl}/search.json`);
    url.searchParams.set('q', params.query);
    url.searchParams.set('offset', String(params.offset));
    url.searchParams.set('limit', String(params.limit));
    url.searchParams.set('fields', 'key,title,subtitle,author_name,first_publish_year,publisher,isbn,number_of_pages_median,cover_i,subject,language');

    if (params.language) {
      url.searchParams.set('language', params.language);
    }

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`Open Library search failed: HTTP ${res.status}`);
    }

    const data: OpenLibrarySearchResponse = await res.json();
    const books = data.docs.map(doc => this.normalizeSearchDoc(doc)).filter(Boolean) as NormalizedBook[];

    return {
      books,
      totalFound: data.numFound,
      hasMore: params.offset + params.limit < data.numFound,
      nextOffset: params.offset + params.limit,
    };
  }

  async fetchBook(externalId: string): Promise<NormalizedBook | null> {
    // externalId is an Open Library work key like /works/OL12345W
    const url = `${this.baseUrl}${externalId}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Open Library fetch failed: HTTP ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    return this.normalizeWork(data);
  }

  private normalizeSearchDoc(doc: OpenLibraryDoc): NormalizedBook | null {
    if (!doc.title || !doc.key) return null;

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined;

    // Extract ISBNs
    let isbn10: string | undefined;
    let isbn13: string | undefined;
    if (doc.isbn) {
      for (const isbn of doc.isbn) {
        const clean = isbn.replace(/[-\s]/g, '');
        if (clean.length === 13 && !isbn13) isbn13 = clean;
        else if (clean.length === 10 && !isbn10) isbn10 = clean;
      }
    }

    // Extract genres from subjects (take first few relevant ones)
    const genres = (doc.subject || [])
      .filter(s => s.length < 50) // skip overly long subject strings
      .slice(0, 5);

    return {
      title: doc.title,
      subtitle: doc.subtitle,
      language: doc.language?.[0],
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
      publisher: doc.publisher?.[0],
      pageCount: doc.number_of_pages_median,
      isbn10,
      isbn13,
      coverUrl,
      authors: doc.author_name || [],
      genres,
      source: {
        provider: 'open_library',
        externalId: doc.key,
        sourceUrl: `${this.baseUrl}${doc.key}`,
      },
    };
  }

  private normalizeWork(data: Record<string, unknown>): NormalizedBook | null {
    const title = data.title as string | undefined;
    const key = data.key as string | undefined;
    if (!title || !key) return null;

    const description = typeof data.description === 'string'
      ? data.description
      : typeof data.description === 'object' && data.description !== null
        ? (data.description as { value?: string }).value
        : undefined;

    const covers = data.covers as number[] | undefined;
    const coverUrl = covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${covers[0]}-M.jpg`
      : undefined;

    const subjects = (data.subjects as Array<{ name?: string }> | string[] | undefined) || [];
    const genres = subjects
      .map(s => typeof s === 'string' ? s : s.name || '')
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 5);

    return {
      title,
      description,
      coverUrl,
      authors: [], // Works API doesn't include author names inline; would need separate fetch
      genres,
      source: {
        provider: 'open_library',
        externalId: key,
        sourceUrl: `${this.baseUrl}${key}`,
      },
    };
  }
}

// Open Library API response types
interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  publisher?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
  language?: string[];
}
