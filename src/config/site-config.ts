import { z } from 'zod';

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export const SUPPORTED_GENRES = [
  'fiction', 'romance', 'fantasy', 'mystery', 'science-fiction',
  'horror', 'thriller', 'historical-fiction', 'literary-fiction',
  'young-adult', 'children', 'non-fiction', 'biography', 'self-help',
  'business', 'history', 'science', 'poetry', 'custom',
] as const;

export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'id',
] as const;

export const siteSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1).max(500),
  language: z.enum(SUPPORTED_LANGUAGES),
  url: z.string().url().or(z.literal('')),
});

export const genreSchema = z.object({
  primary: z.enum(SUPPORTED_GENRES),
  subgenres: z.array(z.string().min(1).max(100)).default([]),
});

export const seoSchema = z.object({
  titleTemplate: z.string().min(1).default('%s'),
  defaultTitle: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  ogImage: z.string().url().or(z.literal('')).default(''),
});

export const providerConfigSchema = z.object({
  enabled: z.boolean(),
});

export const providersSchema = z.object({
  openLibrary: providerConfigSchema.default({ enabled: true }),
  googleBooks: providerConfigSchema.default({ enabled: false }),
});

export const ingestionSchema = z.object({
  batchSize: z.number().int().min(1).max(100).default(20),
  maxBooksPerRun: z.number().int().min(1).max(500).default(100),
});

export const siteConfigSchema = z.object({
  schemaVersion: z.literal(1),
  site: siteSchema,
  genre: genreSchema,
  seo: seoSchema,
  providers: providersSchema,
  ingestion: ingestionSchema,
  setupComplete: z.boolean().default(false),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type Genre = typeof SUPPORTED_GENRES[number];
export type Language = typeof SUPPORTED_LANGUAGES[number];

/**
 * Genre display metadata — used for branding, defaults, and UI theming.
 */
export const GENRE_METADATA: Record<string, {
  label: string;
  emoji: string;
  color: string;
  defaultSubgenres: string[];
  homepageCopy: string;
}> = {
  romance: {
    label: 'Romance',
    emoji: '💕',
    color: '#e11d48',
    defaultSubgenres: ['contemporary-romance', 'historical-romance', 'romantic-suspense', 'paranormal-romance'],
    homepageCopy: 'Discover your next favorite romance novel',
  },
  fantasy: {
    label: 'Fantasy',
    emoji: '🐉',
    color: '#7c3aed',
    defaultSubgenres: ['epic-fantasy', 'urban-fantasy', 'dark-fantasy', 'sword-and-sorcery'],
    homepageCopy: 'Explore worlds of magic and adventure',
  },
  mystery: {
    label: 'Mystery',
    emoji: '🔍',
    color: '#0891b2',
    defaultSubgenres: ['cozy-mystery', 'detective', 'police-procedural', 'whodunit'],
    homepageCopy: 'Unravel gripping mysteries and puzzles',
  },
  'science-fiction': {
    label: 'Science Fiction',
    emoji: '🚀',
    color: '#0284c7',
    defaultSubgenres: ['space-opera', 'cyberpunk', 'hard-sci-fi', 'dystopian'],
    homepageCopy: 'Journey through the frontiers of imagination',
  },
  horror: {
    label: 'Horror',
    emoji: '👻',
    color: '#991b1b',
    defaultSubgenres: ['gothic', 'supernatural', 'psychological-horror', 'cosmic-horror'],
    homepageCopy: 'Dare to explore the darkest stories',
  },
  thriller: {
    label: 'Thriller',
    emoji: '⚡',
    color: '#b45309',
    defaultSubgenres: ['psychological-thriller', 'spy-thriller', 'legal-thriller', 'action-thriller'],
    homepageCopy: 'Heart-pounding stories that keep you on edge',
  },
  fiction: {
    label: 'Fiction',
    emoji: '📖',
    color: '#2563eb',
    defaultSubgenres: ['literary-fiction', 'contemporary', 'historical', 'classics'],
    homepageCopy: 'Browse a curated collection of great fiction',
  },
  'non-fiction': {
    label: 'Non-Fiction',
    emoji: '📚',
    color: '#059669',
    defaultSubgenres: ['biography', 'history', 'science', 'self-help'],
    homepageCopy: 'Explore the world through non-fiction',
  },
  custom: {
    label: 'Books',
    emoji: '📚',
    color: '#2563eb',
    defaultSubgenres: [],
    homepageCopy: 'Discover your next great read',
  },
};

export function getGenreMeta(genre: string) {
  return GENRE_METADATA[genre] || GENRE_METADATA.custom;
}

export function validateConfig(data: unknown): { success: true; config: SiteConfig } | { success: false; errors: string[] } {
  const result = siteConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, config: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

/**
 * Create a default config for a given genre.
 */
export function createDefaultConfig(genre: Genre): SiteConfig {
  const meta = getGenreMeta(genre);
  return {
    schemaVersion: 1,
    site: {
      name: `${meta.label}Book`,
      slug: `${genre}book`,
      description: meta.homepageCopy,
      language: 'en',
      url: '',
    },
    genre: {
      primary: genre,
      subgenres: meta.defaultSubgenres,
    },
    seo: {
      titleTemplate: `%s | ${meta.label}Book`,
      defaultTitle: `${meta.label}Book — Discover ${meta.label} Books`,
      description: meta.homepageCopy,
      ogImage: '',
    },
    providers: {
      openLibrary: { enabled: true },
      googleBooks: { enabled: false },
    },
    ingestion: {
      batchSize: 20,
      maxBooksPerRun: 100,
    },
    setupComplete: false,
  };
}
