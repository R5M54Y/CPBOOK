/**
 * Provider adapter contract.
 * Each book data provider implements this interface.
 */
export interface ProviderAdapter {
  readonly name: string;
  readonly requiresApiKey: boolean;

  /** Check whether this provider is usable (credentials, reachability). */
  checkHealth(): Promise<ProviderHealth>;

  /** Search for books by query, with pagination. */
  search(params: SearchParams): Promise<SearchResult>;

  /** Fetch a single book by provider-specific ID. */
  fetchBook(externalId: string): Promise<NormalizedBook | null>;
}

export interface ProviderHealth {
  status: 'ok' | 'degraded' | 'unavailable';
  message?: string;
}

export interface SearchParams {
  query: string;
  offset: number;
  limit: number;
  language?: string;
}

export interface SearchResult {
  books: NormalizedBook[];
  totalFound: number;
  hasMore: boolean;
  nextOffset: number;
}

/**
 * Normalized book record — provider-agnostic.
 */
export interface NormalizedBook {
  title: string;
  subtitle?: string;
  description?: string;
  language?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  isbn10?: string;
  isbn13?: string;
  coverUrl?: string;
  authors: string[];
  genres: string[];
  // Provider source mapping
  source: {
    provider: string;
    externalId: string;
    sourceUrl?: string;
    sourceUpdatedAt?: string;
  };
}
