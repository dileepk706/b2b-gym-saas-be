import { container } from '@/config/container.js';
import SubscriptionJobService from '@/module/subscription/application/services/subscription-job.service.js';
import { logger } from '@/shared/logger.js';

/**
 * CronScheduler — manages recurring background jobs.
 *
 * All job intervals are configurable via environment variables.
 * Defaults:
 *  - Renewals:              every 60 minutes
 *  - Downgrades:            every 60 minutes
 *  - Payment retries:       every 6 hours
 *  - Expired cancellations: every 24 hours
 *
 * Note: In a multi-instance deployment, use a distributed lock (e.g. Redis)
 * or a dedicated job queue (e.g. BullMQ) instead of setInterval to prevent
 * duplicate job executions across instances.
 */
class CronScheduler {
  private readonly intervals: NodeJS.Timeout[] = [];

  start(): void {
    const jobService = container.resolve<SubscriptionJobService>('SubscriptionJobService');

    this.schedule(
      'RenewalJob',
      () => jobService.processRenewals(),
      this.getIntervalMs('RENEWAL_INTERVAL_MIN', 60),
    );

    this.schedule(
      'DowngradeJob',
      () => jobService.processDowngrades(),
      this.getIntervalMs('DOWNGRADE_INTERVAL_MIN', 60),
    );

    this.schedule(
      'PaymentRetryJob',
      () => jobService.processPaymentRetries(),
      this.getIntervalMs('PAYMENT_RETRY_INTERVAL_MIN', 360),
    );

    this.schedule(
      'ExpiredSubscriptionJob',
      () => jobService.processExpiredCancellations(),
      this.getIntervalMs('EXPIRED_CANCELLATION_INTERVAL_MIN', 1440),
    );

    logger.info('✅ CronScheduler: all subscription jobs started');
  }

  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.length = 0;
    logger.info('CronScheduler: all jobs stopped');
  }

  private schedule(name: string, fn: () => Promise<void>, intervalMs: number): void {
    // Run immediately on startup
    void this.run(name, fn);

    const interval = setInterval(() => void this.run(name, fn), intervalMs);
    // Allow process to exit even if intervals are running
    interval.unref();
    this.intervals.push(interval);

    logger.info(`[${name}] Scheduled every ${intervalMs / 60_000} minutes`);
  }

  private async run(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      logger.info(`[${name}] Starting`);
      await fn();
      logger.info(`[${name}] Completed`);
    } catch (err) {
      logger.error(`[${name}] Error:`, err);
    }
  }

  private getIntervalMs(envKey: string, defaultMinutes: number): number {
    const val = process.env[envKey];
    const minutes = val ? parseInt(val, 10) : defaultMinutes;
    return (isNaN(minutes) ? defaultMinutes : minutes) * 60_000;
  }
}

export default CronScheduler;
