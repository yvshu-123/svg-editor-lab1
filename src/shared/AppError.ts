/**
 * 业务错误。message 就是要给用户看的那句话，
 * `error:` 前缀由 CLI 统一加，这里不带。
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}
