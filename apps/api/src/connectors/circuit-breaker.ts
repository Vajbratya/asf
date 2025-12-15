/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping requests to a failing service.
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 *
 * @example
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 30000
 * });
 *
 * const result = await breaker.execute(async () => {
 *   return await externalService.call();
 * });
 */

import { EventEmitter } from 'events';
import pino from 'pino';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold?: number;
  /** Number of consecutive successes to close circuit from half-open */
  successThreshold?: number;
  /** Time in ms before attempting to close circuit */
  timeout?: number;
  /** Optional name for logging */
  name?: string;
}

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is OPEN') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private nextAttempt: Date | null = null;
  private logger: pino.Logger;

  // Configuration
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly name: string;

  constructor(config: CircuitBreakerConfig = {}) {
    super();

    this.failureThreshold = config.failureThreshold ?? 5;
    this.successThreshold = config.successThreshold ?? 2;
    this.timeout = config.timeout ?? 30000;
    this.name = config.name ?? 'circuit-breaker';

    this.logger = pino({
      name: `circuit-breaker:${this.name}`,
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.toHalfOpen();
      } else {
        const waitTime = this.nextAttempt ? this.nextAttempt.getTime() - Date.now() : this.timeout;
        throw new CircuitOpenError(
          `Circuit breaker is OPEN. Retry in ${Math.ceil(waitTime / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.logger.info(
        { successCount: this.successCount, threshold: this.successThreshold },
        'Circuit breaker success in HALF_OPEN state'
      );

      if (this.successCount >= this.successThreshold) {
        this.toClosed();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.successCount = 0;
    this.lastFailureTime = new Date();

    this.logger.warn(
      {
        error: error.message,
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        state: this.state,
      },
      'Circuit breaker recorded failure'
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens circuit
      this.toOpen();
    } else if (this.failureCount >= this.failureThreshold) {
      this.toOpen();
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) {
      return false;
    }
    return Date.now() >= this.nextAttempt.getTime();
  }

  /**
   * Transition to CLOSED state (normal operation)
   */
  private toClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = null;

    this.logger.info(
      { from: previousState, to: this.state },
      'Circuit breaker transitioned to CLOSED'
    );

    this.emit('stateChange', {
      from: previousState,
      to: this.state,
      timestamp: new Date(),
    });
  }

  /**
   * Transition to OPEN state (failing, rejecting requests)
   */
  private toOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.timeout);

    this.logger.warn(
      {
        from: previousState,
        to: this.state,
        nextAttempt: this.nextAttempt,
        failureCount: this.failureCount,
      },
      'Circuit breaker transitioned to OPEN'
    );

    this.emit('stateChange', {
      from: previousState,
      to: this.state,
      timestamp: new Date(),
      nextAttempt: this.nextAttempt,
    });
  }

  /**
   * Transition to HALF_OPEN state (testing recovery)
   */
  private toHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;

    this.logger.info(
      { from: previousState, to: this.state },
      'Circuit breaker transitioned to HALF_OPEN'
    );

    this.emit('stateChange', {
      from: previousState,
      to: this.state,
      timestamp: new Date(),
    });
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
    };
  }

  /**
   * Manually reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.toClosed();
  }

  /**
   * Manually trip circuit breaker to OPEN state
   */
  trip(): void {
    this.toOpen();
  }
}
