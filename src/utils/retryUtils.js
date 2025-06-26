import { setTimeout } from 'timers/promises';

export class RetryUtils {
  static async withRetry(operation, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      shouldRetry = (error) => true,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (attemptError) {
        lastError = attemptError;

        if (attempt === maxRetries || !shouldRetry(attemptError)) {
          throw attemptError;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        console.log(
          `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          attemptError.message
        );
        await setTimeout(delay);
      }
    }

    throw lastError;
  }

  static isRetryableError(error) {
    if (error.code === 'INTERNAL_SERVER_ERROR') return true;
    if (error.code === 'UNAVAILABLE') return true;
    if (error.code === 'DEADLINE_EXCEEDED') return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('connection')) return true;
    if (error.message?.includes('network')) return true;

    const statusCode = error.status || error.statusCode;
    if (statusCode >= 500 && statusCode < 600) return true;
    if (statusCode === 429) return true;

    return false;
  }

  static async retryFirestoreOperation(operation) {
    return this.withRetry(operation, {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      shouldRetry: this.isRetryableError,
    });
  }

  static async retrySlackOperation(operation) {
    return this.withRetry(operation, {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 3000,
      shouldRetry: (error) => {
        if (this.isRetryableError(error)) return true;
        if (error.data?.error === 'ratelimited') return true;
        return false;
      },
    });
  }
}
