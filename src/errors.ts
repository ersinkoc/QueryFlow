export class QueryFlowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'QueryFlowError';
    this.code = code;
  }
}

export class NetworkError extends QueryFlowError {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super('NETWORK_ERROR', message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export class TimeoutError extends QueryFlowError {
  readonly timeout: number;

  constructor(timeout: number) {
    super('TIMEOUT_ERROR', `Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

export class ValidationError extends QueryFlowError {
  readonly data: unknown;

  constructor(message: string, data: unknown) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    this.data = data;
  }
}

export class CacheError extends QueryFlowError {
  constructor(message: string) {
    super('CACHE_ERROR', message);
    this.name = 'CacheError';
  }
}
