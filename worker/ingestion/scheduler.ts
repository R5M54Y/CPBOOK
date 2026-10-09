import type { Env } from '../index';
import { OpenLibraryAdapter } from '../providers/open-library';
import { upsertBook } from '../deduplication/upsert';

/**
 * Scheduled ingestion runner.
 * Called by cron trigger or manual admin endpoint.
 */
export async function runScheduledIngestion(env: Env): Promise<void> {
  const db = env.DB;

  // Load site config to determine enabled providers and genre
  const configRow = await db.prepare(
    'SELECT config_json FROM site_configuration WHERE id = 1'
  ).first<{ config_json: string }>();

  if (!configRow) {
    console.log('Ingestion skipped: no site configuration');
    return;
  }

  const config = JSON.parse(configRow.config_json);
  if (!config.setupComplete) {
    console.log('Ingestion skipped: setup not complete');
    return;
  }

  // Run Open Library ingestion if enabled
  if (config.providers?.openLibrary?.enabled) {
    await runProviderIngestion(db, 'open_library', config);
  }

  // Future: Google Books adapter would go here
}

async function runProviderIngestion(
  db: D1Database,
  providerName: string,
  config: Record<string, unknown>
): Promise<void> {
  // Check for running job (prevent overlap)
  const runningJob = await db.prepare(
    `SELECT id FROM ingestion_jobs WHERE provider = ? AND status = 'running'`
  ).bind(providerName).first();

  if (runningJob) {
    console.log(`Ingestion skipped: ${providerName} job already running`);
    return;
  }

  // Create job record
  const jobResult = await db.prepare(
    `INSERT INTO ingestion_jobs (provider, status, started_at) VALUES (?, 'running', datetime('now'))`
  ).bind(providerName).run();

  const jobId = jobResult.meta.last_row_id as number;

  const stats = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const adapter = new OpenLibraryAdapter();

    // Health check
    const health = await adapter.checkHealth();
    if (health.status === 'unavailable') {
      throw new Error(`Provider unavailable: ${health.message}`);
    }

    // Determine search query from genre config
    const genre = (config as { genre?: { primary?: string } }).genre?.primary || 'fiction';
    const ingestion = (config as { ingestion?: { batchSize?: number; maxBooksPerRun?: number } }).ingestion;
    const batchSize = ingestion?.batchSize || 20;
    const maxBooks = ingestion?.maxBooksPerRun || 100;

    // Load checkpoint (resume from last offset)
    const lastJob = await db.prepare(
      `SELECT checkpoint_json FROM ingestion_jobs
       WHERE provider = ? AND status = 'completed' AND checkpoint_json IS NOT NULL
       ORDER BY id DESC LIMIT 1`
    ).bind(providerName).first<{ checkpoint_json: string }>();

    let offset = 0;
    if (lastJob?.checkpoint_json) {
      try {
        const checkpoint = JSON.parse(lastJob.checkpoint_json);
        offset = checkpoint.nextOffset || 0;
      } catch {
        // Invalid checkpoint — start fresh
      }
    }

    // Fetch and process in batches
    let totalProcessed = 0;

    while (totalProcessed < maxBooks) {
      const remaining = maxBooks - totalProcessed;
      const currentBatchSize = Math.min(batchSize, remaining);

      const result = await adapter.search({
        query: `subject:${genre}`,
        offset,
        limit: currentBatchSize,
      });

      stats.fetched += result.books.length;

      for (const book of result.books) {
        try {
          const upsertResult = await upsertBook(db, book);
          if (upsertResult.action === 'inserted') stats.inserted++;
          else if (upsertResult.action === 'updated') stats.updated++;
          else stats.skipped++;
        } catch (e) {
          stats.failed++;
          // Log error
          await db.prepare(
            `INSERT INTO ingestion_errors (job_id, provider, error_type, message, external_id, created_at)
             VALUES (?, ?, 'upsert_error', ?, ?, datetime('now'))`
          ).bind(
            jobId, providerName,
            e instanceof Error ? e.message : 'Unknown error',
            book.source.externalId
          ).run();
        }
      }

      totalProcessed += result.books.length;
      offset = result.nextOffset;

      if (!result.hasMore || result.books.length === 0) break;
    }

    // Save checkpoint and mark completed
    await db.prepare(
      `UPDATE ingestion_jobs SET
        status = 'completed',
        finished_at = datetime('now'),
        records_fetched = ?,
        records_inserted = ?,
        records_updated = ?,
        records_skipped = ?,
        records_failed = ?,
        checkpoint_json = ?
       WHERE id = ?`
    ).bind(
      stats.fetched, stats.inserted, stats.updated, stats.skipped, stats.failed,
      JSON.stringify({ nextOffset: offset, completedAt: new Date().toISOString() }),
      jobId
    ).run();

    console.log(`Ingestion completed: ${providerName} — fetched=${stats.fetched} inserted=${stats.inserted} updated=${stats.updated} failed=${stats.failed}`);

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error(`Ingestion failed: ${providerName} — ${errorMessage}`);

    await db.prepare(
      `UPDATE ingestion_jobs SET
        status = 'failed',
        finished_at = datetime('now'),
        records_fetched = ?,
        records_inserted = ?,
        records_updated = ?,
        records_skipped = ?,
        records_failed = ?,
        error_summary = ?
       WHERE id = ?`
    ).bind(
      stats.fetched, stats.inserted, stats.updated, stats.skipped, stats.failed,
      errorMessage, jobId
    ).run();
  }
}
