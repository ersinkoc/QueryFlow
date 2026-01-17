import { describe, it, expect } from 'vitest';

describe('url-parser', () => {
  describe('parseURLTemplate', () => {
    it('should extract parameters from URL template', async () => {
      const { parseURLTemplate } = await import('../../src/core/url-parser.js');
      const parsed = parseURLTemplate('/users/:id/posts/:postId');
      expect(parsed.url).toBe('/users/:id/posts/:postId');
      expect(parsed.params).toEqual(new Set(['id', 'postId']));
    });

    it('should return empty params for no parameters', async () => {
      const { parseURLTemplate } = await import('../../src/core/url-parser.js');
      const parsed = parseURLTemplate('/users');
      expect(parsed.params).toEqual(new Set());
    });
  });

  describe('buildURL', () => {
    it('should replace parameters in URL template', async () => {
      const { buildURL } = await import('../../src/core/url-parser.js');
      const url = buildURL('/users/:id', { id: '123' });
      expect(url).toBe('/users/123');
    });

    it('should handle multiple parameters', async () => {
      const { buildURL } = await import('../../src/core/url-parser.js');
      const url = buildURL('/users/:userId/posts/:postId', { userId: '1', postId: '2' });
      expect(url).toBe('/users/1/posts/2');
    });
  });

  describe('buildSearchParams', () => {
    it('should build query string', async () => {
      const { buildSearchParams } = await import('../../src/core/url-parser.js');
      const qs = buildSearchParams({ page: 1, limit: 10 });
      expect(qs).toBe('?page=1&limit=10');
    });

    it('should encode special characters', async () => {
      const { buildSearchParams } = await import('../../src/core/url-parser.js');
      const qs = buildSearchParams({ search: 'hello world' });
      expect(qs).toBe('?search=hello%20world');
    });

    it('should return empty string for no params', async () => {
      const { buildSearchParams } = await import('../../src/core/url-parser.js');
      const qs = buildSearchParams({});
      expect(qs).toBe('');
    });
  });

  describe('buildFullURL', () => {
    it('should build full URL with base URL', async () => {
      const { buildFullURL } = await import('../../src/core/url-parser.js');
      const url = buildFullURL('https://api.com', '/users/:id', { id: '123' });
      expect(url).toBe('https://api.com/users/123');
    });

    it('should build full URL with search params', async () => {
      const { buildFullURL } = await import('../../src/core/url-parser.js');
      const url = buildFullURL('https://api.com', '/users', {}, { page: 1 });
      expect(url).toBe('https://api.com/users?page=1');
    });

    it('should work without base URL', async () => {
      const { buildFullURL } = await import('../../src/core/url-parser.js');
      const url = buildFullURL(undefined, '/users/:id', { id: '123' });
      expect(url).toBe('/users/123');
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key from URL and params', async () => {
      const { generateCacheKey } = await import('../../src/core/url-parser.js');
      const key = generateCacheKey('/users/:id', { id: '123' });
      expect(key).toBe('/users/:id|id:123');
    });

    it('should sort params for consistent keys', async () => {
      const { generateCacheKey } = await import('../../src/core/url-parser.js');
      const key1 = generateCacheKey('/users', { b: '2', a: '1' });
      const key2 = generateCacheKey('/users', { a: '1', b: '2' });
      expect(key1).toBe(key2);
    });
  });
});
