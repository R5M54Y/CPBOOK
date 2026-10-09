import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  normalizeAuthorName,
  normalizeIsbn,
  generateSlug,
  stripHtml,
} from '../../worker/normalization/normalize';

describe('normalization', () => {
  describe('normalizeTitle', () => {
    it('lowercases and trims', () => {
      expect(normalizeTitle('  The Great Gatsby  ')).toBe('great gatsby');
    });

    it('strips leading articles', () => {
      expect(normalizeTitle('A Tale of Two Cities')).toBe('tale of two cities');
      expect(normalizeTitle('An Example Book')).toBe('example book');
      expect(normalizeTitle('The Hobbit')).toBe('hobbit');
    });

    it('collapses whitespace', () => {
      expect(normalizeTitle('Some   Book   Title')).toBe('some book title');
    });

    it('returns empty string for empty input', () => {
      expect(normalizeTitle('')).toBe('');
    });
  });

  describe('normalizeAuthorName', () => {
    it('lowercases and trims', () => {
      expect(normalizeAuthorName('  J.K. Rowling  ')).toBe('jk rowling');
    });

    it('strips dots', () => {
      expect(normalizeAuthorName('J.R.R. Tolkien')).toBe('jrr tolkien');
    });
  });

  describe('normalizeIsbn', () => {
    it('strips hyphens and spaces', () => {
      expect(normalizeIsbn('978-0-13-468599-1')).toBe('9780134685991');
    });

    it('returns null for empty/null input', () => {
      expect(normalizeIsbn('')).toBeNull();
      expect(normalizeIsbn(null as any)).toBeNull();
      expect(normalizeIsbn(undefined as any)).toBeNull();
    });

    it('returns null for invalid length', () => {
      expect(normalizeIsbn('123')).toBeNull();
    });

    it('accepts 10-digit ISBN', () => {
      expect(normalizeIsbn('0-13-468599-X')).toBe('013468599X');
    });
  });

  describe('generateSlug', () => {
    it('generates a URL-safe slug', () => {
      expect(generateSlug('The Great Gatsby')).toBe('the-great-gatsby');
    });

    it('handles special characters', () => {
      expect(generateSlug("Harry Potter & the Sorcerer's Stone")).toBe('harry-potter-the-sorcerers-stone');
    });

    it('collapses multiple hyphens', () => {
      expect(generateSlug('Some---Book---Title')).toBe('some-book-title');
    });

    it('trims leading/trailing hyphens', () => {
      expect(generateSlug('---Book---')).toBe('book');
    });
  });

  describe('stripHtml', () => {
    it('strips HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('returns plain text unchanged', () => {
      expect(stripHtml('No tags here')).toBe('No tags here');
    });
  });
});
