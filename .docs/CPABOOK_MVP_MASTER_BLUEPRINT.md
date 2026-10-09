# CPABOOK MVP: MASTER IMPLEMENTATION BLUEPRINT

## 1. ROLE AND MISSION

You are the lead software architect, senior full-stack engineer, Cloudflare engineer, and implementation agent for **CPABOOK**, a reusable, genre-specific book catalog website platform.

Your mission is to inspect the available project environment, establish the correct architecture, and implement a functional MVP using the existing repository and tools.

Do not stop after producing a plan, mockup, or technical proposal. After a short implementation plan, begin implementing the project in small, verifiable stages.

Work autonomously on low-risk technical decisions. Do not wait for user approval for routine implementation choices. Ask for clarification only when a missing decision materially affects architecture, cost, security, legal access, or irreversible changes.

Never fabricate API endpoints, API capabilities, credentials, environment values, test results, or successful deployments.

## 2. PRODUCT VISION

CPABOOK is a reusable website template for creating multiple independent book catalog websites organized around specific genres or niches.

Example deployments:

* RomanceBook: romance and contemporary romance.
* FantasyBook: fantasy and epic fantasy.
* MysteryBook: mystery and detective fiction.
* SciFiBook: science fiction.
* HorrorBook: horror fiction.
* CustomBook: any user-defined niche.

Each website should have its own identity, catalog configuration, SEO settings, and deployment-specific environment configuration.

The sites originate from **one canonical GitHub template repository**, maintained centrally. Each production website must have an isolated working copy, fork, or independently managed branch/project configuration.

The goal is not to build a multi-tenant publishing platform for the MVP. The goal is to build a reusable engine that can be initialized into multiple independent websites without manually rewriting the codebase for each genre.

### Core product principle

**One codebase. Many independent websites. One required setup process per website.**

A website's genre must influence its branding, navigation, metadata, category presentation, content discovery, and SEO defaults. Genre configuration must not be a cosmetic label alone.

## 3. FIRST ACTIONS: INSPECT BEFORE IMPLEMENTING

Before modifying anything:

1. Inspect the current working directory and determine whether a repository already exists.
2. Check the Git status, current branch, recent commits, and existing uncommitted changes.
3. Inspect the existing files, package manager, framework, scripts, environment examples, and tests.
4. Determine whether the project is already connected to Lovable, GitHub, Cloudflare, or other available services.
5. Inspect the tools and integrations actually available to you.
6. Review current official documentation for the framework and relevant Cloudflare products before relying on version-sensitive behavior.
7. Identify which resources are accessible and which require credentials, account permissions, or user actions.

Do not overwrite existing work without inspecting it first.

Then produce a concise implementation plan containing:

* Current repository state.
* Proposed architecture and key decisions.
* Implementation stages.
* Required external accounts and secrets.
* Known blockers and assumptions.

After presenting the plan, immediately begin Stage 1 unless a genuine blocker makes progress impossible.

Do not spend the entire task researching or planning. Use documentation research to resolve specific implementation questions.

## 4. MVP SCOPE

### Required features

1. Reusable genre-based website template.
2. Mandatory initial site setup flow.
3. Independent site configuration for every deployment.
4. Responsive catalog homepage and book listing pages.
5. Book detail pages.
6. Search, genre filtering, and pagination or incremental loading.
7. Cloudflare D1 for normalized book metadata and ingestion state.
8. Cloudflare Workers for API integrations and scheduled ingestion.
9. Cloudflare R2 for optional stored assets that genuinely need object storage.
10. API-first book ingestion from supported external sources.
11. Duplicate detection and idempotent ingestion.
12. Basic administration or operational controls for ingestion.
13. SEO metadata, canonical URLs, sitemap, and robots directives.
14. Configuration and environment validation.
15. Logging, retry behavior, and actionable error reporting.
16. Automated tests and deployment documentation.

### Explicitly out of scope for the MVP

Do not build these unless the existing project already requires them or they are essential to a working implementation:

* User accounts and social profiles.
* Ratings, reviews, comments, and community features.
* Payments, subscriptions, or affiliate monetization.
* Full-text hosting of copyrighted books.
* E-book or audiobook distribution.
* Complex recommendation algorithms.
* A shared multi-tenant SaaS administration platform.
* An elaborate analytics platform.
* Unapproved scraping of third-party websites.

Prioritize a working, maintainable catalog over unnecessary features.

## 5. TARGET ARCHITECTURE

Use the following architecture, adapting only when inspection demonstrates a concrete reason to do so.

### Frontend

Use the existing framework if it is suitable. If the repository is empty, choose a Lovable-compatible React and TypeScript stack with a suitable routing solution and a maintainable component structure.

The frontend must provide:

* Responsive homepage.
* Genre-aware navigation and presentation.
* Searchable book catalog.
* Book detail pages.
* Loading, empty, and error states.
* Mandatory initial setup.
* A clear unavailable or incomplete configuration state.
* Basic operational visibility for ingestion where appropriate.

Keep source-provider credentials out of client-side code.

### Backend and infrastructure

Use Cloudflare services as follows:

* **Cloudflare Workers:** backend API endpoints, source adapters, and scheduled ingestion orchestration.
* **Cloudflare D1:** relational metadata database, ingestion jobs, source mappings, and operational records.
* **Cloudflare R2:** optional object storage for eligible images or other assets that need to be stored. Do not use R2 as a relational database.
* **Cloudflare Cron Triggers:** scheduled ingestion execution.
* **Cloudflare secrets and environment bindings:** confidential credentials and deployment-specific runtime settings.

Use a supported Cloudflare D1 access pattern, such as the Workers D1 binding, rather than exposing database credentials to the browser.

Do not assume the frontend can safely connect directly to privileged D1 or R2 operations.

### High-level data flow

External book APIs → source adapters → normalization → validation → deduplication → D1 upsert → catalog API → website pages.

Cron Triggers should start bounded ingestion work. Avoid trying to process an unlimited catalog in a single Worker invocation.

Where ingestion exceeds execution limits, implement pagination, checkpoints, queueing or continuation mechanisms as justified by the current Cloudflare platform capabilities and project scale.

## 6. CANONICAL TEMPLATE AND DEPLOYMENT ISOLATION

Maintain one canonical GitHub repository as the source of truth for the reusable template.

Each website must be initialized as an independent deployment with its own effective configuration.

Acceptable models include:

* A separate repository created from the template.
* A fork with independent configuration.
* A separately managed branch and deployment, provided configuration, secrets, database resources, and deployment operations remain isolated.

Prefer separate repositories or forks for the MVP because they simplify ownership and reduce configuration collisions.

### Critical isolation requirement

Do not connect multiple independently configured websites to the same writable Git branch and then store different site configurations in that branch.

That arrangement can cause one site's configuration to overwrite another's.

Shared source code does not mean shared mutable deployment configuration.

Each deployment must have independently assigned values for:

* Site identity and genre.
* Production domain and canonical URL.
* Cloudflare D1 database binding or database ID.
* R2 bucket binding if needed.
* Worker deployment configuration.
* Environment variables and secrets.
* Provider-specific ingestion settings.
* SEO configuration.
* Optional analytics settings.

Shared infrastructure is allowed only when explicitly designed, documented, and isolated safely. Do not introduce a shared catalog database by default.

## 7. MANDATORY SITE SETUP

Implement an initial setup experience that must be completed before a website is considered configured and ready to serve its intended catalog.

The setup flow must collect or confirm the following.

### Required site settings

1. Site name.
2. Site slug or identifier.
3. Primary book genre or niche.
4. Supported language.
5. Brand description.
6. SEO site title.
7. SEO description.
8. Canonical production URL, or an explicit temporary-development mode.
9. Selected supported book data providers.
10. Confirmation of any provider credentials or access permissions required.

### Optional settings

* Logo and favicon.
* Theme preferences.
* Secondary genres.
* Additional locales.
* Custom homepage copy.
* Social links.
* Additional provider-specific settings.
* Analytics configuration.

Provide sensible defaults for optional fields.

Validate required fields, supported values, URL format, slug format, and source-provider requirements.

The user should not be able to mark setup complete if required settings are invalid or essential deployment dependencies are missing.

### Setup implementation

Use a clear onboarding interface with:

* A progress indicator.
* Helpful field labels and validation messages.
* A summary screen before saving.
* A final configuration status.
* A route or state for incomplete setup.
* A way to review or update configuration later.

Do not make the application depend on hardcoded assumptions about the Romance genre or any other single genre.

### Configuration persistence

Create a documented configuration model.

For example, use a validated `site.config.json` for public, non-secret site settings where appropriate.

Store deployment secrets separately in Cloudflare environment bindings or the relevant secret manager.

Choose the persistence mechanism deliberately:

* If each deployment has an independent repository, a committed site configuration file may be appropriate for non-secret settings.
* If configuration must be editable at runtime, use an appropriate persistent configuration store or protected administration workflow.
* Do not put secrets in a public configuration file.
* Do not silently commit user-provided secrets to Git.
* Do not store all deployment configurations in a shared writable file that causes cross-site contamination.

Version the configuration schema and provide defaults or migrations when the schema evolves.

## 8. IMPORTANT LIMITATION: LOVABLE PUBLISHING

Do not claim that an application-level setup wizard automatically blocks Lovable's native Publish button.

A wizard inside the website controls the website's behavior. It does not automatically control Lovable's own deployment interface.

Implement a realistic, layered readiness process:

1. **Configuration validation:** validate required site configuration and report missing values.
2. **Build preflight:** run a validation script before the production build.
3. **CI validation:** where GitHub Actions is available, fail the workflow when required configuration is missing or invalid.
4. **Deployment procedure:** document the required configuration steps before publishing through Lovable.
5. **Runtime readiness gate:** prevent normal catalog operation when setup is incomplete.
6. **Infrastructure validation:** verify required environment bindings and database migrations before declaring the deployment ready.

If a deployment requires environment-specific secrets or resources that cannot be validated during a local build, use explicit deployment checks rather than pretending the build has verified them.

If a native Lovable workflow does not support a custom blocking hook, state that limitation clearly and use the preflight procedure.

The application must distinguish between:

* Setup incomplete.
* Configuration valid but infrastructure unverified.
* Ready for deployment.
* Operational and successfully ingesting data.

Do not report production readiness without evidence.

## 9. BOOK DATA PROVIDERS: API-FIRST

Build a provider-adapter architecture so additional data sources can be integrated without rewriting the ingestion engine.

Start with providers that offer documented, usable API access.

### Initial provider candidates

**Open Library**

Investigate its current official API documentation, usage guidance, identifiers, pagination, rate limits, and data licensing.

Use appropriate search and edition/work endpoints based on the actual documented capabilities.

**Google Books API**

Investigate its official documentation, access requirements, quotas, available metadata, pagination, and applicable terms.

Do not assume an API key is unnecessary or that every field is available for every book.

**Goodreads**

Goodreads is optional and must not be treated as a guaranteed MVP dependency.

Only integrate Goodreads when an authorized, documented access method is available and the intended use is permitted.

Do not implement unauthorized scraping, bypass authentication, evade anti-bot controls, or circumvent rate limits.

If Goodreads access is unavailable, disable that adapter and document the limitation. The MVP must remain fully usable without it.

### Provider adapter contract

Create a common interface that accommodates capabilities actually supported by each provider.

The contract should cover:

* Provider identification.
* Supported search or discovery operations.
* Pagination or continuation state.
* Fetching and normalizing book records.
* Rate-limit handling.
* Retryable versus non-retryable errors.
* Source attribution and external identifiers.
* Provider-specific limitations.
* Health or operational status.

Do not pretend all providers support identical search, pagination, update, or discovery operations.

### Provider policy

Maintain a registry of enabled providers per deployment.

Each provider should have its own configuration, access checks, and operational status.

An unavailable optional provider must not prevent other providers from working.

Do not invent API endpoints or fields. Confirm them using official documentation before implementation.

## 10. AUTOMATED INGESTION PIPELINE

Implement a scheduled, incremental, resumable ingestion pipeline.

### Required pipeline stages

1. Scheduled trigger or authorized manual trigger.
2. Load the deployment's ingestion configuration.
3. Select an enabled provider.
4. Acquire an appropriate lock or otherwise prevent overlapping jobs.
5. Load the previous checkpoint or continuation state.
6. Fetch a bounded batch from the provider.
7. Validate and normalize incoming records.
8. Resolve source identifiers and likely duplicates.
9. Upsert records into D1.
10. Save continuation state or checkpoint.
11. Record job statistics and errors.
12. Continue within platform execution limits or schedule subsequent work.

### Scheduling

Use Cloudflare Cron Triggers for recurring ingestion.

Choose a conservative initial schedule and document how to change it.

Do not schedule an aggressive crawl that violates provider usage guidelines.

A manual ingestion endpoint may be included for administrators. Protect it with proper authentication and authorization. Never leave a privileged ingestion endpoint publicly callable without controls.

### Incremental ingestion

Avoid downloading the entire source catalog on every run.

Prefer supported strategies such as:

* Pagination.
* Source-specific updated-since queries.
* Checkpoints.
* Saved continuation tokens.
* Bounded discovery batches.
* Periodic reconciliation jobs where justified.

Use the capabilities actually available from each source.

### Retry behavior

Use bounded retries with exponential backoff and jitter where appropriate.

Respect provider-provided retry instructions and rate-limit responses.

Classify failures as:

* Transient network or provider errors.
* Rate limiting.
* Authentication or authorization failures.
* Invalid provider responses.
* Validation errors.
* Database errors.
* Permanent unsupported operations.

Do not endlessly retry permanent errors.

### Job safety

Prevent duplicate or overlapping jobs from corrupting state.

Make processing idempotent so a repeated batch does not create duplicate records.

Persist enough information to resume after partial failure.

## 11. CLOUDFLARE D1 DATABASE SCHEMA

Create versioned D1 migrations. Use SQLite-compatible schema definitions supported by Cloudflare D1.

Design the schema for normalized book metadata, provider mappings, ingestion state, and operational observability.

The following is the minimum conceptual schema. Refine it when official API behavior or repository constraints justify changes.

### Table: books

Suggested fields:

* `id`: internal primary key.
* `title`: normalized display title.
* `subtitle`: nullable.
* `description`: nullable.
* `language`: nullable language code.
* `published_date`: nullable text or normalized date representation.
* `publisher`: nullable.
* `page_count`: nullable integer.
* `isbn_10`: nullable.
* `isbn_13`: nullable.
* `cover_url`: nullable.
* `primary_author`: nullable display value if needed for efficient rendering.
* `metadata_json`: optional validated JSON for non-core extensible metadata.
* `created_at`.
* `updated_at`.

Choose a consistent internal ID strategy. Do not assume ISBN exists for every book.

### Table: authors

Suggested fields:

* `id`.
* `name`.
* `normalized_name`.
* `external_identifier`, nullable.
* `created_at`.
* `updated_at`.

### Table: book_authors

Suggested fields:

* `book_id`.
* `author_id`.
* `author_order`.

Use a composite key or appropriate unique constraint.

### Table: genres

Suggested fields:

* `id`.
* `name`.
* `slug`.

### Table: book_genres

Suggested fields:

* `book_id`.
* `genre_id`.
* `source`, nullable.

Support multiple genre assignments where appropriate.

Do not assume an external provider's genre taxonomy matches CPABOOK's configured genre.

### Table: book_sources

Map external provider records to canonical internal books.

Suggested fields:

* `id`.
* `book_id`.
* `provider`.
* `external_id`.
* `source_url`, nullable.
* `source_updated_at`, nullable.
* `last_seen_at`.
* `created_at`.
* `updated_at`.

Enforce uniqueness on the appropriate provider and external identifier combination.

### Table: ingestion_jobs

Suggested fields:

* `id`.
* `provider`.
* `status`.
* `started_at`.
* `finished_at`, nullable.
* `records_fetched`.
* `records_inserted`.
* `records_updated`.
* `records_skipped`.
* `records_failed`.
* `error_summary`, nullable.
* `checkpoint_json`, nullable.

### Table: ingestion_errors

Suggested fields:

* `id`.
* `job_id`.
* `provider`.
* `error_type`.
* `message`.
* `external_id`, nullable.
* `created_at`.

Do not store secrets, authentication headers, or sensitive payloads in logs.

### Table: site_configuration

Only create this table if the selected architecture requires runtime configuration storage in D1.

Suggested fields:

* `id`.
* `config_json`.
* `schema_version`.
* `updated_at`.

For an independently deployed website, a single active configuration record may be sufficient.

If the architecture introduces shared databases across websites, explicitly add and enforce tenant isolation. Do not assume isolation exists merely because every row contains a site identifier.

### Database requirements

* Add indexes for title search, normalized title, ISBN, author relationships, genre relationships, provider mappings, and common catalog queries.
* Use foreign keys where appropriate and supported by the chosen configuration.
* Use unique constraints for source identity.
* Use prepared statements and parameter binding.
* Use transactions for related mutations where supported.
* Keep migrations reproducible and version-controlled.
* Test migrations against a disposable development database before production rollout.
* Document any trade-offs related to SQLite search capabilities and indexing.

## 12. BOOK DEDUPLICATION AND CANONICALIZATION

Different providers may describe the same book differently. Implement deterministic deduplication with a conservative matching strategy.

### Matching priority

1. Exact provider plus external identifier match.
2. Exact normalized ISBN-13 match.
3. Exact normalized ISBN-10 match where appropriate.
4. Conservative title and author matching for candidate identification.

Treat title-author matching as a heuristic, not definitive proof of identity.

Do not merge different editions blindly. A work and its individual editions may need to be represented separately if the provider metadata supports that distinction.

Normalize carefully:

* Whitespace.
* Unicode.
* Case where appropriate.
* ISBN formatting.
* Author-name formatting for comparison.

Preserve original source identifiers and provenance.

### Merge rules

* Never overwrite good metadata with null or empty values by default.
* Track which provider supplied each external record.
* Apply documented field-precedence rules.
* Preserve source-specific identifiers.
* Avoid losing valid edition information.
* Make updates idempotent.
* Record conflicting metadata when it materially affects data quality.

Write tests for repeated ingestion, overlapping provider records, missing ISBNs, different editions, and incomplete metadata.

## 13. CLOUDFLARE R2 OBJECT STORAGE

R2 is optional and should be used only where it adds value.

Potential uses:

* Eligible cached cover assets.
* Site-owned uploaded logos or branding assets.
* Generated assets that the project is permitted to store.

Do not assume that a cover image can be copied and redistributed merely because its URL is public.

Before caching or mirroring external images, review the relevant provider terms, copyright considerations, and applicable permissions.

For the initial MVP, storing and displaying provider-supplied cover URLs may be simpler when allowed.

If R2 is used:

* Create a documented bucket setup process.
* Use Workers bindings for server-side operations.
* Avoid exposing privileged bucket access.
* Apply sensible object naming and content-type validation.
* Handle missing assets gracefully.
* Configure public access or a custom domain only when needed and appropriately secured.
* Document CORS and caching requirements where applicable.
* Never treat R2 as a replacement for D1 queries or relational constraints.

If R2 is not needed for the first working version, do not block the MVP on it.

## 14. GENRE CONFIGURATION AND SEO

Genre configuration must affect the website's identity and discovery experience.

### Examples

RomanceBook:

* Romance-focused navigation.
* Romance-specific homepage copy.
* Relevant subgenre filters.
* Romance-oriented metadata defaults.

FantasyBook:

* Fantasy-focused navigation.
* Fantasy subgenre taxonomy.
* Fantasy-specific page descriptions and discovery labels.

These examples are defaults, not hardcoded restrictions.

### SEO requirements

Implement:

* Unique document titles.
* Meta descriptions.
* Canonical URLs.
* Open Graph metadata.
* Appropriate social preview metadata.
* Semantic headings.
* Crawlable book detail URLs.
* XML sitemap generation.
* Robots directives.
* Correct not-found behavior.
* Appropriate handling of incomplete or duplicate metadata.
* Pagination or crawl strategy suited to the catalog.
* Structured data only where the content and implementation satisfy the applicable schema requirements.

Do not generate thousands of thin, duplicate, or misleading pages merely to increase indexed URLs.

Do not claim that configuration alone guarantees search engine rankings.

### Canonical URL behavior

Each deployment must have a configured canonical production URL.

Temporary preview deployments should not accidentally advertise themselves as the production canonical domain.

Use an explicit development or preview mode when the final domain is not yet known.

### Book detail pages

Use stable, readable URLs based on a slug plus a stable identifier where appropriate.

Do not rely solely on a title slug that may collide with another book.

## 15. APPLICATION STRUCTURE

Adapt to the existing repository rather than forcing an unnecessary rewrite.

If starting from scratch, use a maintainable structure similar to:

```
cpabook/
├── README.md
├── AGENTS.md
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── site.config.example.json
├── scripts/
│   ├── validate-config.ts
│   ├── preflight.ts
│   └── setup-site.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── DATA_SOURCES.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── OPERATIONS.md
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── ...
├── src/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── config/
│   ├── catalog/
│   ├── seo/
│   └── lib/
├── worker/
│   ├── index.ts
│   ├── routes/
│   ├── ingestion/
│   ├── providers/
│   ├── normalization/
│   ├── deduplication/
│   └── lib/
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── wrangler.toml
```

This is a proposed structure, not an instruction to create empty files or split code artificially.

Use a separate frontend and Worker directory only if that is compatible with the chosen tooling and deployment strategy. If the existing project uses a different structure, preserve it and document the rationale.

Keep modules focused and avoid both giant files and excessive abstraction.

## 16. API AND FRONTEND REQUIREMENTS

Define documented endpoints appropriate to the chosen implementation.

Potential catalog endpoints:

* `GET /api/books`
* `GET /api/books/:id`
* `GET /api/genres`
* `GET /api/health`

Potential administrative endpoints:

* `POST /api/admin/ingestion/run`
* `GET /api/admin/ingestion/status`

These are proposed routes, not pre-existing endpoints. Implement only the routes needed by the chosen architecture.

### Catalog endpoint requirements

* Validate query parameters.
* Support bounded pagination.
* Apply configured genre filtering.
* Use prepared database statements.
* Return consistent response shapes.
* Handle empty results.
* Avoid unbounded database queries.
* Use suitable cache behavior for public catalog data.
* Avoid caching protected administration responses.

### Administration security

Any administrative route must require appropriate authentication and authorization.

Do not treat a hidden button or obscure URL as access control.

Use an appropriate authenticated mechanism for the actual deployment environment. Document how administrative credentials or identity are provisioned.

Do not ship default production passwords or hardcoded administrator tokens.

## 17. CONFIGURATION AND ENVIRONMENT MANAGEMENT

Create `.env.example` and a clear configuration reference.

Possible variables or bindings include:

* `SITE_NAME`
* `SITE_SLUG`
* `SITE_GENRE`
* `SITE_LANGUAGE`
* `SITE_URL`
* Provider API keys, only when actually required.
* Cloudflare account or deployment identifiers where required by the deployment workflow.
* Authentication configuration for administration.
* Optional analytics settings.

Use the configuration model that fits the chosen deployment architecture. Do not duplicate values unnecessarily between a JSON file, environment variables, and D1.

Document the precedence rules if values can be supplied from multiple places.

### Rules

* Never commit actual secrets.
* Never put secret provider keys in client-side environment variables.
* Never fabricate valid-looking credentials.
* Never silently fall back to an insecure default.
* Fail clearly when a required value is absent.
* Allow genuinely optional integrations to remain disabled.
* Keep development and production settings separate.
* Validate URLs, slugs, supported genres, languages, and provider selections.
* Redact credentials and sensitive headers from errors.

Create a safe setup command that helps initialize configuration without printing secret values to logs.

## 18. LOGGING, MONITORING, AND ERROR HANDLING

Implement structured operational logging appropriate for Workers.

Include useful fields such as:

* Timestamp.
* Environment.
* Job ID.
* Provider.
* Operation.
* Result status.
* Record counts.
* Duration.
* Error category.

Do not log access tokens, secret environment values, or unnecessary personal data.

Provide a simple means to inspect:

* Last successful ingestion.
* Last attempted ingestion.
* Active or recently completed jobs.
* Number of records fetched, inserted, updated, skipped, and failed.
* Provider health or last error.
* Missing configuration or credentials.

Distinguish a successful deployment from a successful ingestion job.

If no provider credentials are available, the application should still start in an understandable state. Clearly identify the integration as unconfigured instead of inventing book records or reporting a false success.

If a provider is unavailable, other enabled providers should continue operating when feasible.

## 19. SECURITY AND COMPLIANCE

Apply secure defaults.

Required practices:

* Validate and sanitize external data.
* Use parameterized SQL statements.
* Protect administrative routes.
* Enforce reasonable request and ingestion limits.
* Validate external URLs before server-side fetching.
* Avoid server-side request forgery risks.
* Prevent secrets from entering client bundles, logs, Git history, or error responses.
* Apply sensible CORS rules.
* Use HTTPS in production.
* Handle provider errors without leaking internal details.
* Review dependencies and use maintained versions.
* Avoid bypassing third-party access restrictions.
* Respect API terms, licenses, rate limits, and attribution requirements.
* Avoid storing or redistributing book content without the necessary rights.

For book metadata and cover images, distinguish between metadata retrieval, image display, image caching, and redistribution. Each may have different permissions.

If legal or contractual permission is unclear, disable the questionable behavior and document the required decision.

## 20. TESTING STRATEGY

Implement automated tests appropriate to the repository and chosen stack.

### Unit tests

Cover:

* Configuration validation.
* Genre defaults.
* URL and slug validation.
* Metadata normalization.
* ISBN normalization.
* Duplicate detection.
* Provider error classification.
* Retry and checkpoint logic.
* SEO metadata generation.

### Integration tests

Cover:

* D1 migrations.
* Book insertion and updates.
* Provider-to-canonical-record mapping.
* Idempotent repeated ingestion.
* API pagination and filters.
* Invalid request handling.
* Ingestion failure and recovery.
* Configuration readiness states.

Use mocks or recorded fixtures for external provider tests where appropriate. Tests must not require live API credentials to pass in a clean development environment.

Do not use fabricated fixtures as evidence that a live provider integration works.

### UI tests

Verify:

* Initial setup is visible when configuration is missing.
* Required fields show validation errors.
* A valid configuration can complete setup.
* Genre settings affect the site's presentation.
* Catalog loading, empty, error, and success states render properly.
* Book detail pages handle incomplete metadata.
* Mobile layouts remain usable.

### Build and static checks

Add appropriate scripts for:

* Type checking.
* Linting.
* Unit tests.
* Integration tests.
* Configuration validation.
* Production build.
* Deployment preflight.

Run all checks supported by the environment and report the actual results.

Do not state that tests pass unless they were executed successfully.

## 21. REQUIRED FILES AND DELIVERABLES

Create or update the files actually needed to make the MVP functional.

At minimum, deliver:

1. Working frontend application.
2. Initial setup and configuration validation.
3. Genre-aware rendering and SEO.
4. Book catalog and detail pages.
5. D1 migrations.
6. Worker API and ingestion orchestration.
7. At least one real, documented provider adapter.
8. Provider adapter contract for future sources.
9. Cron configuration and setup instructions.
10. Deduplication and normalization logic.
11. Structured logging and error handling.
12. `.env.example`.
13. Example non-secret site configuration.
14. `README.md`.
15. `AGENTS.md` with repository-specific implementation conventions.
16. Architecture documentation.
17. Setup and deployment documentation.
18. Data source and permission documentation.
19. Security documentation.
20. Automated tests.
21. Configuration validation and deployment preflight scripts.
22. A clear list of external credentials, accounts, and manual actions still required.

Do not create fake implementations merely to satisfy the file list.

If a component cannot be completed because of missing access, create a clearly documented integration boundary and actionable setup instructions. Do not misrepresent the placeholder as a working integration.

## 22. IMPLEMENTATION ORDER

Implement in these stages.

### Stage 1: Repository assessment and foundation

* Inspect the repository and tools.
* Confirm framework and package manager.
* Establish or preserve project conventions.
* Write a concise implementation plan.
* Set up configuration validation.
* Establish the minimum build and test commands.

**Exit condition:** the project foundation is understood, and configuration errors can be detected.

### Stage 2: Site setup and isolation

* Implement the site configuration schema.
* Implement mandatory onboarding.
* Add validation and incomplete-setup behavior.
* Separate public settings from secrets.
* Document the per-deployment isolation model.

**Exit condition:** a site can be configured independently without affecting another deployment.

### Stage 3: Database and catalog

* Create D1 migrations.
* Implement normalized book and author models.
* Implement genre mapping.
* Add book listing and detail endpoints.
* Build the catalog UI.
* Add basic search, filters, and pagination.

**Exit condition:** the website can display catalog records from D1.

### Stage 4: Provider integration and ingestion

* Confirm official provider documentation.
* Implement the first usable API adapter.
* Normalize metadata.
* Implement deduplication.
* Implement bounded, resumable ingestion.
* Add job logging and error handling.
* Add scheduled execution configuration.

**Exit condition:** authorized provider data can be ingested and retrieved from the catalog.

### Stage 5: SEO and genre experience

* Implement genre-aware branding and navigation.
* Generate page metadata and canonical URLs.
* Implement sitemap and robots behavior.
* Verify book detail URLs and crawlability.

**Exit condition:** each configured site presents its own coherent genre identity and SEO metadata.

### Stage 6: Validation and operational hardening

* Add and run unit and integration tests.
* Test invalid and missing configuration.
* Test repeated ingestion and provider failure.
* Add deployment preflight.
* Review security and dependency risks.
* Verify mobile behavior.

**Exit condition:** the available automated checks pass, or remaining failures are explicitly documented.

### Stage 7: Documentation and handoff

* Complete setup and deployment guides.
* List required Cloudflare resources and bindings.
* Document how to create another genre website from the canonical template.
* List all unresolved external dependencies.
* Provide the final test and implementation report.

**Exit condition:** another developer can reproduce the setup without guessing missing steps.

## 23. ACCEPTANCE CRITERIA

The MVP is acceptable when the following are demonstrably true.

### Template and setup

* A new website can be initialized from the canonical template.
* The setup process requires the necessary site-specific configuration.
* Invalid configuration produces actionable errors.
* Missing required configuration prevents the site from being marked ready.
* Secrets are not stored in public configuration.
* Separate deployments do not overwrite each other's settings.

### Catalog

* The website can retrieve books from D1.
* Users can browse and open book detail pages.
* Search, filters, and pagination work within the chosen implementation.
* Missing metadata does not break the UI.
* Genre configuration affects the catalog experience.

### Ingestion

* At least one authorized API provider is implemented and documented.
* Scheduled ingestion is configured using supported Cloudflare capabilities.
* Duplicate batches do not create duplicate canonical records.
* Failed jobs produce useful operational errors.
* Ingestion can resume safely where the provider and implementation support continuation.
* Optional provider failures do not unnecessarily disable the entire catalog.

### SEO and security

* Titles, descriptions, and canonical URLs reflect the deployment configuration.
* Sitemap and robots behavior are appropriate for the deployment environment.
* Privileged operations are protected.
* API keys and secrets are not exposed to browser code.
* Provider access restrictions and applicable terms are respected.

### Quality and delivery

* Type checking and linting pass where configured.
* Automated tests pass, or remaining failures are explicitly identified.
* A production build completes successfully in the available environment.
* Deployment requirements and manual steps are documented.
* No unverified live integration or deployment is reported as successful.

## 24. AUTONOMY AND DECISION RULES

Follow these rules throughout implementation:

1. Inspect before editing.
2. Prefer small, coherent changes over a large unreviewable rewrite.
3. Use existing dependencies and conventions where reasonable.
4. Add dependencies only when they provide a clear benefit.
5. Check official documentation for version-sensitive APIs.
6. Never invent secrets or assume external account access.
7. Never bypass source-provider restrictions.
8. Do not ask the user to approve routine low-risk technical choices.
9. If a high-impact choice is genuinely ambiguous, explain the trade-off and ask one focused question.
10. When blocked by credentials, continue with independently testable work.
11. Keep configuration, migrations, and documentation synchronized.
12. Run relevant tests after meaningful changes.
13. Fix regressions introduced by your own changes.
14. Do not silently discard existing work.
15. Do not claim success without evidence.

If tool permissions allow file changes but not external deployment, implement locally, validate what is possible, and provide precise deployment instructions.

## 25. FINAL HANDOFF REPORT

At the end, report:

1. What was implemented.
2. Which files or subsystems were added or changed.
3. Which architecture decisions were made and why.
4. Which tests and build commands were actually run.
5. Their actual pass/fail results.
6. Which Cloudflare resources must be created.
7. Which environment variables or secrets are required, without revealing their values.
8. Which provider integrations are operational and which remain disabled or unverified.
9. Whether deployment was actually completed or only prepared.
10. Known limitations and recommended next steps.

Clearly separate these statuses:

* Implemented.
* Tested locally.
* Requires external credentials.
* Requires manual configuration.
* Deployed and verified.

Never collapse these into one vague claim of completion.

## FINAL DIRECTIVE

Begin by inspecting the existing repository and available tools.

Produce a short implementation plan, then immediately start Stage 1.

Build a working, reusable CPABOOK MVP, not just a collection of architectural documents. Keep the solution simple enough for an MVP, robust enough for automated ingestion, and structured enough to support additional genres and providers later.

The canonical template is the engine. Each deployment is an independently configured website. The catalog grows through authorized, repeatable ingestion. Every important claim of readiness must be backed by validation or an actual test.

Before starting implementation, write the complete CPABOOK MVP Master Implementation Blueprint from the previous instructions into a Markdown document at:

`.docs/CPABOOK_MVP_MASTER_BLUEPRINT.md`
