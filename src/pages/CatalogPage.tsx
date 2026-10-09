import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteConfig } from '../config/SiteConfigContext';
import { getGenreMeta } from '../config/site-config';

interface Book {
  id: number;
  title: string;
  subtitle: string | null;
  primary_author: string | null;
  cover_url: string | null;
  published_date: string | null;
  slug: string;
}

interface BooksResponse {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function CatalogPage() {
  const { config } = useSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const genreMeta = config ? getGenreMeta(config.genre.primary) : null;

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (search) params.set('q', search);
      if (genre) params.set('genre', genre);

      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) throw new Error(`Failed to load books: ${res.status}`);
      const data: BooksResponse = await res.json();
      setBooks(data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, genre]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('q', searchInput);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: genreMeta?.color }}>
        {genreMeta?.emoji} Book Catalog
      </h1>

      {/* Search + Filter Bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by title or author..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        {config && config.genre.subgenres.length > 0 && (
          <select
            value={genre}
            onChange={e => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('genre', e.target.value);
              } else {
                params.delete('genre');
              }
              params.set('page', '1');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Genres</option>
            {config.genre.subgenres.map(sg => (
              <option key={sg} value={sg}>
                {sg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchBooks} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No books found</p>
          {search && <p className="text-gray-400 mt-2">Try adjusting your search terms</p>}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} book{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map(book => (
              <Link
                key={book.id}
                to={`/books/${book.slug}-${book.id}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-gray-400 text-4xl">📖</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{book.title}</h3>
                  {book.primary_author && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{book.primary_author}</p>
                  )}
                  {book.published_date && (
                    <p className="text-xs text-gray-400 mt-1">{book.published_date.slice(0, 4)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page - 1));
                  setSearchParams(p);
                }}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(page + 1));
                  setSearchParams(p);
                }}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
