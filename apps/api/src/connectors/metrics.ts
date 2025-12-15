/**
 * Prometheus Metrics for Connectors
 *
 * Provides standardized metrics collection for all connectors.
 * Exposes metrics in Prometheus format for monitoring and alerting.
 *
 * @example
 * import { connectorMetrics } from './metrics';
 *
 * connectorMetrics.messagesReceived.inc({ connector: 'tasy', org: 'hospital-a' });
 * connectorMetrics.latencyHistogram.observe({ connector: 'tasy' }, 150);
 */

import { register, Counter, Gauge, Histogram, Registry } from 'prom-client';

export interface ConnectorLabels {
  connector: string;
  org?: string;
  type?: string;
}

/**
 * Connector-specific metrics
 */
export class ConnectorMetrics {
  public readonly registry: Registry;

  // Counters
  public readonly messagesReceived: Counter<string>;
  public readonly messagesSent: Counter<string>;
  public readonly messagesFailed: Counter<string>;
  public readonly connectionsOpened: Counter<string>;
  public readonly connectionsClosed: Counter<string>;
  public readonly errorsTotal: Counter<string>;

  // Gauges
  public readonly activeConnections: Gauge<string>;
  public readonly connectionUptime: Gauge<string>;
  public readonly circuitBreakerState: Gauge<string>;

  // Histograms
  public readonly latencyHistogram: Histogram<string>;
  public readonly messageSizeBytes: Histogram<string>;

  constructor(customRegistry?: Registry) {
    this.registry = customRegistry ?? register;

    // Messages received counter
    this.messagesReceived = new Counter({
      name: 'integrasaude_connector_messages_received_total',
      help: 'Total number of messages received by connector',
      labelNames: ['connector', 'org', 'type', 'message_type'],
      registers: [this.registry],
    });

    // Messages sent counter
    this.messagesSent = new Counter({
      name: 'integrasaude_connector_messages_sent_total',
      help: 'Total number of messages sent by connector',
      labelNames: ['connector', 'org', 'type', 'message_type'],
      registers: [this.registry],
    });

    // Messages failed counter
    this.messagesFailed = new Counter({
      name: 'integrasaude_connector_messages_failed_total',
      help: 'Total number of failed messages',
      labelNames: ['connector', 'org', 'type', 'error_code', 'retryable'],
      registers: [this.registry],
    });

    // Connections opened counter
    this.connectionsOpened = new Counter({
      name: 'integrasaude_connector_connections_opened_total',
      help: 'Total number of connections opened',
      labelNames: ['connector', 'org', 'type'],
      registers: [this.registry],
    });

    // Connections closed counter
    this.connectionsClosed = new Counter({
      name: 'integrasaude_connector_connections_closed_total',
      help: 'Total number of connections closed',
      labelNames: ['connector', 'org', 'type', 'reason'],
      registers: [this.registry],
    });

    // Total errors counter
    this.errorsTotal = new Counter({
      name: 'integrasaude_connector_errors_total',
      help: 'Total number of errors by connector',
      labelNames: ['connector', 'org', 'type', 'error_type'],
      registers: [this.registry],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: 'integrasaude_connector_active_connections',
      help: 'Number of currently active connections',
      labelNames: ['connector', 'org', 'type'],
      registers: [this.registry],
    });

    // Connection uptime gauge (in seconds)
    this.connectionUptime = new Gauge({
      name: 'integrasaude_connector_uptime_seconds',
      help: 'Connection uptime in seconds',
      labelNames: ['connector', 'org', 'type'],
      registers: [this.registry],
    });

    // Circuit breaker state gauge (0=CLOSED, 1=HALF_OPEN, 2=OPEN)
    this.circuitBreakerState = new Gauge({
      name: 'integrasaude_connector_circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
      labelNames: ['connector', 'org', 'type'],
      registers: [this.registry],
    });

    // Message latency histogram (in milliseconds)
    this.latencyHistogram = new Histogram({
      name: 'integrasaude_connector_message_latency_ms',
      help: 'Message processing latency in milliseconds',
      labelNames: ['connector', 'org', 'type', 'operation'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });

    // Message size histogram (in bytes)
    this.messageSizeBytes = new Histogram({
      name: 'integrasaude_connector_message_size_bytes',
      help: 'Message size in bytes',
      labelNames: ['connector', 'org', 'type', 'direction'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
      registers: [this.registry],
    });
  }

  /**
   * Record a message received
   */
  recordMessageReceived(labels: ConnectorLabels & { message_type: string }): void {
    this.messagesReceived.inc(labels);
  }

  /**
   * Record a message sent
   */
  recordMessageSent(labels: ConnectorLabels & { message_type: string }): void {
    this.messagesSent.inc(labels);
  }

  /**
   * Record a message failure
   */
  recordMessageFailed(labels: ConnectorLabels & { error_code: string; retryable: string }): void {
    this.messagesFailed.inc(labels);
  }

  /**
   * Record connection opened
   */
  recordConnectionOpened(labels: ConnectorLabels): void {
    this.connectionsOpened.inc(labels);
    this.activeConnections.inc(labels);
  }

  /**
   * Record connection closed
   */
  recordConnectionClosed(labels: ConnectorLabels & { reason: string }): void {
    this.connectionsClosed.inc(labels);
    this.activeConnections.dec({ connector: labels.connector, org: labels.org, type: labels.type });
  }

  /**
   * Record an error
   */
  recordError(labels: ConnectorLabels & { error_type: string }): void {
    this.errorsTotal.inc(labels);
  }

  /**
   * Update connection uptime
   */
  updateUptime(labels: ConnectorLabels, uptimeMs: number): void {
    this.connectionUptime.set(labels, uptimeMs / 1000);
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(labels: ConnectorLabels, state: number): void {
    this.circuitBreakerState.set(labels, state);
  }

  /**
   * Record latency
   */
  recordLatency(labels: ConnectorLabels & { operation: string }, latencyMs: number): void {
    this.latencyHistogram.observe(labels, latencyMs);
  }

  /**
   * Record message size
   */
  recordMessageSize(
    labels: ConnectorLabels & { direction: 'in' | 'out' },
    sizeBytes: number
  ): void {
    this.messageSizeBytes.observe(labels, sizeBytes);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJSON(): Promise<any> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Reset all metrics to zero
   */
  resetMetrics(): void {
    this.registry.resetMetrics();
  }
}

// Export singleton instance
export const connectorMetrics = new ConnectorMetrics();

/**
 * Helper to time async operations
 */
export async function timeOperation<T>(
  fn: () => Promise<T>,
  onComplete: (durationMs: number) => void
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    onComplete(duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    onComplete(duration);
    throw error;
  }
}

/**
 * Circuit breaker state to metric value mapping
 */
export function circuitStateToMetric(state: string): number {
  switch (state) {
    case 'CLOSED':
      return 0;
    case 'HALF_OPEN':
      return 1;
    case 'OPEN':
      return 2;
    default:
      return -1;
  }
}
