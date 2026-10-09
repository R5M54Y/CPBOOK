# CPABOOK Implementation Conventions

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Router
- **Backend**: Cloudflare Workers + Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **First provider**: Open Library (no API key required)

## Code Style
- TypeScript strict mode
- ES modules
- Named exports preferred
- Functional React components with hooks
- Tailwind utility classes for styling

## File Conventions
- Frontend source in `src/`
- Worker source in `worker/`
- Migrations in `migrations/` (sequential numbered SQL files)
- Tests in `test/` (unit/ and integration/ subdirs)
- Documentation in `.docs/`

## API Routes
- All API routes prefixed with `/api/`
- Admin routes require `Authorization: Bearer <ADMIN_TOKEN>`
- Use prepared D1 statements (no raw SQL interpolation)

## Ingestion
- Provider adapters implement `ProviderAdapter` interface
- Books are normalized before D1 upsert
- Deduplication: source mapping → ISBN → title+author match
- Never overwrite existing metadata with null values
- Bounded batch processing with checkpoint resumption

## Configuration
- Site config stored in D1 `site_configuration` table
- Non-secret settings in `site.config.json` (gitignored)
- Secrets via Cloudflare environment bindings
- Schema validated with Zod
