import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/shared/AppError.js';

describe('AppError', () => {
  it('message 就是给用户看的那句话', () => {
    const error = new AppError('id already exists: r1');
    expect(error.message).toBe('id already exists: r1');
  });

  it('是 Error 的子类，name 固定', () => {
    const error = new AppError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
  });
});
