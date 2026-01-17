import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager, cacheManagerPlugin } from '../../src/plugins/core/cache-manager.js';
import { Kernel } from '../../src/kernel.js';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager();
  });

  it('should set and get data', () => {
    cacheManager.set('key1', { data: 'value' });
    expect(cacheManager.get('key1')).toEqual({ data: 'value' });
  });

  it('should return undefined for non-existent key', () => {
    expect(cacheManager.get('nonexistent')).toBeUndefined();
  });

  it('should update existing entry', () => {
    cacheManager.set('key1', { data: 'value' });
    cacheManager.update('key1', (data: any) => ({ ...data, updated: true }));
    expect(cacheManager.get('key1')).toEqual({ data: 'value', updated: true });
  });

  it('should invalidate by pattern', () => {
    cacheManager.set('/users/123', { id: 123 });
    cacheManager.set('/users/456', { id: 456 });
    cacheManager.set('/posts', { items: [] });

    cacheManager.invalidate('/users/*');

    expect(cacheManager.get('/users/123')).toBeUndefined();
    expect(cacheManager.get('/users/456')).toBeUndefined();
    expect(cacheManager.get('/posts')).toEqual({ items: [] });
  });

  it('should invalidate by array key', () => {
    cacheManager.set('users:123', { id: 123 });
    cacheManager.invalidate(['users', '123']);

    expect(cacheManager.get('users:123')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cacheManager.set('key1', { data: 'value1' });
    cacheManager.set('key2', { data: 'value2' });

    cacheManager.clear();

    expect(cacheManager.size()).toBe(0);
  });

  it('should consider stale entries as not available', () => {
    cacheManager.set('key1', { data: 'value' }, { staleTime: -1 });
    expect(cacheManager.get('key1')).toBeUndefined();
  });

  it('should consider fresh entries as available', () => {
    cacheManager.set('key1', { data: 'value' }, { staleTime: 10000 });
    expect(cacheManager.get('key1')).toEqual({ data: 'value' });
  });
});
