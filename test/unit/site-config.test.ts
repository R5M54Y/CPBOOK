import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  createDefaultConfig,
  getGenreMeta,
  SUPPORTED_GENRES,
  SUPPORTED_LANGUAGES,
} from '../../src/config/site-config';

describe('site-config', () => {
  describe('validateConfig', () => {
    it('validates a complete valid config', () => {
      const config = createDefaultConfig('romance');
      config.setupComplete = true;
      const result = validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('rejects config with missing required fields', () => {
      const result = validateConfig({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('rejects invalid schema version', () => {
      const config = createDefaultConfig('fiction');
      (config as any).schemaVersion = 2;
      const result = validateConfig(config);
      expect(result.success).toBe(false);
    });

    it('rejects invalid slug format', () => {
      const config = createDefaultConfig('fiction');
      config.site.slug = 'Invalid Slug!';
      const result = validateConfig(config);
      expect(result.success).toBe(false);
    });

    it('rejects empty site name', () => {
      const config = createDefaultConfig('fiction');
      config.site.name = '';
      const result = validateConfig(config);
      expect(result.success).toBe(false);
    });

    it('allows empty URL for dev mode', () => {
      const config = createDefaultConfig('fiction');
      config.site.url = '';
      const result = validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('validates proper URL format', () => {
      const config = createDefaultConfig('fiction');
      config.site.url = 'https://example.com';
      const result = validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL format', () => {
      const config = createDefaultConfig('fiction');
      config.site.url = 'not-a-url';
      const result = validateConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('createDefaultConfig', () => {
    it('creates config for each supported genre', () => {
      for (const genre of SUPPORTED_GENRES) {
        const config = createDefaultConfig(genre);
        expect(config.genre.primary).toBe(genre);
        expect(config.schemaVersion).toBe(1);
        expect(config.setupComplete).toBe(false);
        expect(config.site.name).toBeTruthy();
        expect(config.site.slug).toBeTruthy();
      }
    });

    it('romance config has romance-specific subgenres', () => {
      const config = createDefaultConfig('romance');
      expect(config.genre.subgenres).toContain('contemporary-romance');
      expect(config.site.name).toBe('RomanceBook');
    });

    it('fantasy config has fantasy-specific subgenres', () => {
      const config = createDefaultConfig('fantasy');
      expect(config.genre.subgenres).toContain('epic-fantasy');
      expect(config.site.name).toBe('FantasyBook');
    });

    it('default config has Open Library enabled', () => {
      const config = createDefaultConfig('fiction');
      expect(config.providers.openLibrary.enabled).toBe(true);
      expect(config.providers.googleBooks.enabled).toBe(false);
    });
  });

  describe('getGenreMeta', () => {
    it('returns metadata for known genres', () => {
      const meta = getGenreMeta('romance');
      expect(meta.label).toBe('Romance');
      expect(meta.emoji).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.defaultSubgenres.length).toBeGreaterThan(0);
      expect(meta.homepageCopy).toBeTruthy();
    });

    it('returns custom fallback for unknown genre', () => {
      const meta = getGenreMeta('unknown-genre');
      expect(meta.label).toBe('Books');
    });
  });

  describe('SUPPORTED_GENRES', () => {
    it('includes major genres', () => {
      expect(SUPPORTED_GENRES).toContain('romance');
      expect(SUPPORTED_GENRES).toContain('fantasy');
      expect(SUPPORTED_GENRES).toContain('mystery');
      expect(SUPPORTED_GENRES).toContain('science-fiction');
      expect(SUPPORTED_GENRES).toContain('horror');
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('includes English', () => {
      expect(SUPPORTED_LANGUAGES).toContain('en');
    });
  });
});
