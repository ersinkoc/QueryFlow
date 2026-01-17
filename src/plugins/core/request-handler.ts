import type { Plugin, QueryOptions, ClientConfig } from '../../types.js';
import type { Kernel } from '../../kernel.js';
import { NetworkError, TimeoutError, ValidationError } from '../../errors.js';
import { buildFullURL, generateCacheKey } from '../../core/url-parser.js';

interface RequestContext {
  requestHandler: RequestHandler;
}

export class RequestHandler {
  private pendingRequests = new Map<string, Promise<unknown>>();
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  async fetch(
    urlTemplate: string,
    options: QueryOptions = {},
    signal?: AbortSignal
  ): Promise<{ data: unknown }> {
    const key = this.buildKey(urlTemplate, options);

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<{ data: unknown }>;
    }

    const request = this.execute(urlTemplate, options, signal);
    this.pendingRequests.set(key, request);

    try {
      return await request;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async execute(
    urlTemplate: string,
    options: QueryOptions,
    signal?: AbortSignal
  ): Promise<{ data: unknown }> {
    const fullUrl = buildFullURL(
      this.config.baseUrl,
      urlTemplate,
      options.params ?? {},
      options.searchParams
    );

    const headers = this.buildHeaders(options);

    const timeout = options.retryDelay ?? this.config.timeout;

    try {
      const response = await this.withRetry(
        async () => {
          const controller = new AbortController();
          const timeoutId = timeout
            ? setTimeout(() => controller.abort(), timeout)
            : undefined;

          const combinedSignal = signal
            ? AbortSignal.any([signal, controller.signal])
            : controller.signal;

          try {
            return await fetch(fullUrl, {
              method: 'GET',
              headers,
              signal: combinedSignal,
            });
          } finally {
            if (timeoutId !== undefined) clearTimeout(timeoutId);
          }
        },
        options.retry
      );

      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      this.validateData(data);

      return { data };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeout ?? 0);
      }
      throw error;
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retry: number | boolean = 3
  ): Promise<T> {
    const attempts = typeof retry === 'number' ? retry : 3;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.delay(i * 1000);
      }
    }

    throw new Error('Retry failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildHeaders(options: QueryOptions): Record<string, string> {
    const configHeaders = this.config.headers;
    const baseHeaders =
      typeof configHeaders === 'function' ? configHeaders() : configHeaders ?? {};

    return {
      'Content-Type': 'application/json',
      ...baseHeaders,
    };
  }

  private buildKey(url: string, options: QueryOptions): string {
    const params = options.params ?? {};
    const searchParams = options.searchParams ?? {};
    return generateCacheKey(url, { ...params, ...searchParams });
  }

  private validateData(data: unknown): void {
    if (data === null || data === undefined) {
      throw new ValidationError('Response data cannot be null or undefined', data);
    }
  }

  updateConfig(config: ClientConfig): void {
    this.config = { ...this.config, ...config };
  }
}

export const requestHandlerPlugin: Plugin<RequestContext> = {
  name: 'request-handler',
  version: '1.0.0',

  install(kernel: Kernel<RequestContext>): void {
    const requestHandler = new RequestHandler(kernel.getConfig());
    const context = kernel.getContext();

    context.requestHandler = requestHandler;

    kernel.on('request:fetch', async ({ url, options, signal }) => {
      return requestHandler.fetch(url, options, signal);
    });
  },
};

export type { RequestContext };
