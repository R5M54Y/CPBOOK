# CPABOOK

Reusable, genre-specific book catalog website platform. One codebase → many independent book catalog websites (RomanceBook, FantasyBook, MysteryBook, etc.).

Built on **Cloudflare Workers + D1 + React + TypeScript + Tailwind CSS + Hono**.

## Quick Start

```bash
# Install dependencies
npm install

# Start development (frontend + worker)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Architecture

```
Frontend:  React + Vite + Tailwind CSS + React Router
Backend:   Cloudflare Workers + Hono
Database:  Cloudflare D1 (SQLite)
Ingestion: Open Library API (first provider)
```

## Project Structure

```
├── src/               # React frontend
│   ├── config/        # Site config schema + context
│   ├── pages/         # Route pages (Home, Catalog, BookDetail, Setup)
│   ├── components/    # Shared components (Layout)
│   └── seo/           # SEO head management
├── worker/            # Cloudflare Worker backend
│   ├── routes/        # Hono API routes
│   ├── providers/     # Book data provider adapters
│   ├── normalization/ # Text normalization utilities
│   ├── deduplication/ # Book upsert + dedup logic
│   └── ingestion/     # Scheduled ingestion pipeline
├── migrations/        # D1 SQL migrations
├── test/              # Unit + integration tests
└── .docs/             # Blueprint + documentation
```

## Creating a New Genre Website

1. Create a new repo from this template (or fork).
2. Run `npm install`.
3. Configure Cloudflare D1: `npx wrangler d1 create <your-db-name>`.
4. Update `wrangler.toml` with the database ID.
5. Run migrations: `npx wrangler d1 execute <db-name> --file=./migrations/0001_initial_schema.sql`.
6. Start the app and complete the setup wizard.
7. Deploy: `npx wrangler deploy`.

## Environment

Copy `.env.example` to `.env` for local development. See `site.config.example.json` for the full configuration schema.

### Required Cloudflare Resources

- **D1 Database**: For book metadata, ingestion state, and site config.
- **Workers**: Backend API and scheduled ingestion.

### Optional

- **R2 Bucket**: For stored cover images (deferred in MVP).
- **Google Books API Key**: For Google Books provider.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/books` | List books (pagination, search, genre filter) |
| GET | `/api/books/:id` | Book detail with authors, genres, sources |
| GET | `/api/genres` | List genres with book counts |
| GET | `/api/config` | Load site configuration |
| PUT | `/api/config` | Save site configuration |
| GET | `/api/health` | Health check |
| POST | `/api/admin/ingestion/run` | Trigger manual ingestion (auth required) |
| GET | `/api/admin/ingestion/status` | Recent ingestion jobs (auth required) |

## Data Providers

### Open Library ✅
- No API key required
- Search + work/edition metadata
- Cover images via covers.openlibrary.org

### Google Books (planned)
- Requires API key
- Comprehensive metadata

## License

MIT
