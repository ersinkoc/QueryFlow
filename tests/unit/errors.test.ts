import { describe, it, expect } from 'vitest';

describe('errors', () => {
  it('should create QueryFlowError with code', async () => {
    const { QueryFlowError } = await import('../../src/errors.js');
    const error = new QueryFlowError('TEST_CODE', 'Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
  });

  it('should create NetworkError with cause', async () => {
    const { NetworkError } = await import('../../src/errors.js');
    const cause = new Error('Network failed');
    const error = new NetworkError('Network error', cause);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.cause).toBe(cause);
  });

  it('should create TimeoutError with timeout', async () => {
    const { TimeoutError } = await import('../../src/errors.js');
    const error = new TimeoutError(5000);
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.timeout).toBe(5000);
  });

  it('should create ValidationError with data', async () => {
    const { ValidationError } = await import('../../src/errors.js');
    const data = { invalid: 'value' };
    const error = new ValidationError('Invalid data', data);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.data).toBe(data);
  });
});
