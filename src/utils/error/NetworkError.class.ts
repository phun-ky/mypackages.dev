export class NetworkError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body?: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'NetworkError';
  }
}
