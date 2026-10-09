import { Link } from 'react-router-dom';
import { useSiteConfig } from '../config/SiteConfigContext';
import { getGenreMeta } from '../config/site-config';

export function HomePage() {
  const { config } = useSiteConfig();
  if (!config) return null;

  const genre = getGenreMeta(config.genre.primary);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="py-20 text-white"
        style={{ backgroundColor: genre.color }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {genre.emoji} {config.site.name}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
            {config.site.description}
          </p>
          <Link
            to="/books"
            className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </section>

      {/* Genre Categories */}
      {config.genre.subgenres.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Explore {genre.label} Subgenres
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {config.genre.subgenres.map(sg => (
                <Link
                  key={sg}
                  to={`/books?genre=${sg}`}
                  className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
                >
                  <span className="text-lg font-medium text-gray-800">
                    {sg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">About {config.site.name}</h2>
          <p className="text-gray-600 leading-relaxed">
            {config.seo.description}
          </p>
        </div>
      </section>
    </div>
  );
}
