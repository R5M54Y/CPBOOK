import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSiteConfig } from '../config/SiteConfigContext';
import { getGenreMeta } from '../config/site-config';
import { SEOHead } from '../seo/SEOHead';

interface BookDetail {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: string | null;
  published_date: string | null;
  publisher: string | null;
  page_count: number | null;
  isbn_10: string | null;
  isbn_13: string | null;
  cover_url: string | null;
  primary_author: string | null;
  slug: string;
  authors: Array<{ id: number; name: string }>;
  genres: Array<{ id: number; name: string; slug: string }>;
  sources: Array<{ provider: string; external_id: string; source_url: string | null }>;
}

export function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useSiteConfig();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const genreMeta = config ? getGenreMeta(config.genre.primary) : null;

  useEffect(() => {
    if (!slug) return;
    // Extract ID from slug-id format
    const parts = slug.split('-');
    const id = parts[parts.length - 1];
    if (!id || isNaN(Number(id))) {
      setError('Invalid book URL');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/books/${id}`)
      .then(res => {
        if (res.status === 404) throw new Error('Book not found');
        if (!res.ok) throw new Error(`Failed to load book: ${res.status}`);
        return res.json();
      })
      .then(data => setBook(data as BookDetail))
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Book not found'}</h1>
        <Link to="/books" className="text-blue-600 hover:underline">← Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEOHead
        title={book.title}
        description={book.description?.slice(0, 160) || `${book.title} by ${book.primary_author || 'Unknown Author'}`}
        ogImage={book.cover_url || undefined}
      />

      <Link to="/books" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Back to Catalog
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="md:w-1/3 flex-shrink-0">
          <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">📖</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
          {book.subtitle && <p className="text-xl text-gray-600 mt-1">{book.subtitle}</p>}

          {book.authors.length > 0 && (
            <p className="text-lg mt-3" style={{ color: genreMeta?.color }}>
              by {book.authors.map(a => a.name).join(', ')}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {book.publisher && (
              <div>
                <span className="text-gray-500">Publisher:</span>
                <span className="ml-2 text-gray-900">{book.publisher}</span>
              </div>
            )}
            {book.published_date && (
              <div>
                <span className="text-gray-500">Published:</span>
                <span className="ml-2 text-gray-900">{book.published_date}</span>
              </div>
            )}
            {book.page_count && (
              <div>
                <span className="text-gray-500">Pages:</span>
                <span className="ml-2 text-gray-900">{book.page_count}</span>
              </div>
            )}
            {book.language && (
              <div>
                <span className="text-gray-500">Language:</span>
                <span className="ml-2 text-gray-900">{book.language.toUpperCase()}</span>
              </div>
            )}
            {book.isbn_13 && (
              <div>
                <span className="text-gray-500">ISBN-13:</span>
                <span className="ml-2 text-gray-900">{book.isbn_13}</span>
              </div>
            )}
            {book.isbn_10 && (
              <div>
                <span className="text-gray-500">ISBN-10:</span>
                <span className="ml-2 text-gray-900">{book.isbn_10}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {book.genres.length > 0 && (
            <div className="mt-6">
              <span className="text-sm text-gray-500 mr-2">Genres:</span>
              {book.genres.map(g => (
                <Link
                  key={g.id}
                  to={`/books?genre=${g.slug}`}
                  className="inline-block px-3 py-1 mr-2 mb-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.description}</p>
            </div>
          )}

          {/* Sources */}
          {book.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Data Sources</h3>
              <div className="flex gap-4">
                {book.sources.map((s, i) => (
                  <span key={i} className="text-xs text-gray-400">
                    {s.source_url ? (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">
                        {s.provider}
                      </a>
                    ) : s.provider}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
