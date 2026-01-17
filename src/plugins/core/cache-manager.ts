import type { Plugin, QueryOptions } from '../../types.js';
import type { Kernel } from '../../kernel.js';
import { CacheError } from '../../errors.js';
import { generateCacheKey } from '../../core/url-parser.js';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}

interface CacheMeta {
  url: string;
  params: Record<string, string | number>;
}

interface CacheManagerContext {
  cache: CacheManager;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private meta = new Map<string, CacheMeta>();

  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isStale(entry)) {
      return undefined;
    }

    return entry.data;
  }

  set(key: string, data: unknown, options: QueryOptions = {}): void {
    const now = Date.now();
    const staleTime = options.staleTime ?? 5000;
    const cacheTime = options.cacheTime ?? 300000;

    this.cache.set(key, {
      data,
      timestamp: now,
      staleTime,
      cacheTime,
    });
  }

  update(key: string, updater: (data: unknown) => unknown): void {
    const entry = this.cache.get(key);
    if (!entry) {
      throw new CacheError(`Cache entry "${key}" not found`);
    }

    try {
      entry.data = updater(entry.data);
    } catch (error) {
      throw new CacheError(`Failed to update cache entry "${key}"`);
    }
  }

  invalidate(pattern: string | string[]): void {
    if (typeof pattern === 'string') {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          this.meta.delete(key);
        }
      }
    } else {
      const key = pattern.join(':');
      this.cache.delete(key);
      this.meta.delete(key);
    }
  }

  invalidateRelated(url: string): void {
    const relatedKeys: string[] = [];

    for (const [key, meta] of this.meta.entries()) {
      if (this.isRelated(url, meta.url, meta.params)) {
        relatedKeys.push(key);
      }
    }

    relatedKeys.forEach(key => {
      this.cache.delete(key);
      this.meta.delete(key);
    });
  }

  clear(): void {
    this.cache.clear();
    this.meta.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  setMeta(key: string, meta: CacheMeta): void {
    this.meta.set(key, meta);
  }

  private isStale(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp > entry.staleTime;
  }

  private isRelated(
    url1: string,
    url2: string,
    params2: Record<string, string | number>
  ): boolean {
    if (url1 === url2) return false;

    const params1 = this.extractParams(url1);
    const params1Values = this.getParamValues(url1, params1);

    if (url1.includes('/:id/') && url2.includes('/:id/')) {
      return params1Values.id === params2.id;
    }

    if (url1.startsWith(url2.replace(/\/:[^/]+/g, ''))) {
      return true;
    }

    if (url2.startsWith(url1.replace(/\/:[^/]+/g, ''))) {
      return true;
    }

    return false;
  }

  private extractParams(url: string): Set<string> {
    const params = new Set<string>();
    const regex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = regex.exec(url)) !== null) {
      params.add(match[1]);
    }

    return params;
  }

  private getParamValues(url: string, params: Set<string>): Record<string, string> {
    const values: Record<string, string> = {};
    for (const param of params) {
      const regex = new RegExp(`:${param}([^/]|$)`);
      const match = url.match(regex);
      if (match) {
        values[param] = match[1];
      }
    }
    return values;
  }
}

export const cacheManagerPlugin: Plugin<CacheManagerContext> = {
  name: 'cache-manager',
  version: '1.0.0',

  install(kernel: Kernel<CacheManagerContext>): void {
    const cacheManager = new CacheManager();
    const context = kernel.getContext();

    context.cache = cacheManager;

    kernel.on('query:success', ({ key, data, options }) => {
      cacheManager.set(key, data, options);
    });

    kernel.on('cache:invalidate', ({ pattern }) => {
      cacheManager.invalidate(pattern);
    });

    kernel.on('cache:invalidate:auto', ({ url }) => {
      cacheManager.invalidateRelated(url);
    });
  },
};

export type { CacheManagerContext };
