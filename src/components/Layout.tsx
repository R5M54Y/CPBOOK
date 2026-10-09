import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../config/SiteConfigContext';
import { getGenreMeta } from '../config/site-config';

export function Layout({ children }: { children: ReactNode }) {
  const { config } = useSiteConfig();
  const genre = config ? getGenreMeta(config.genre.primary) : null;
  const siteName = config?.site.name || 'CPABOOK';

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b shadow-sm"
        style={{ borderBottomColor: genre?.color || '#2563eb' }}
      >
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center gap-2" style={{ color: genre?.color }}>
            <span>{genre?.emoji}</span>
            <span>{siteName}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/books" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Catalog
            </Link>
            {config?.genre.subgenres.slice(0, 3).map(sg => (
              <Link
                key={sg}
                to={`/books?genre=${sg}`}
                className="text-sm text-gray-500 hover:text-gray-700 hidden md:block"
              >
                {sg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {siteName}. Book data provided by Open Library and other sources.</p>
          <p className="mt-1">
            Powered by <a href="https://github.com/R5M54Y/CPBOOK" className="underline hover:text-gray-700">CPABOOK</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
