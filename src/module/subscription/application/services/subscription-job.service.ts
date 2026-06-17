import { inject, injectable } from 'tsyringe';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import MockPaymentProvider from '@/module/subscription/infrastructure/mock-payment.provider.js';
import SubscriptionService from '@/module/subscription/application/services/subscription.service.js';
import { logger } from '@/shared/logger.js';

const MAX_PAYMENT_ATTEMPTS = 3;

/**
 * SubscriptionJobService — background job runner.
 *
 * Each method is a self-contained job that can be called by a cron scheduler.
 * All jobs use FOR UPDATE SKIP LOCKED to prevent concurrent processing.
 *
 * Jobs:
 *  - processRenewals          → active (at period_end) → generate invoice + pay
 *  - processDowngrades        → active + scheduled_plan_id (at period_end) → swap plan
 *  - processPaymentRetries    → past_due → retry failed invoice
 *  - processExpiredCancelled  → cancelled (past period_end) → expired
 */
@injectable()
class SubscriptionJobService {
  constructor(
    @inject('ISubscriptionRepository')
    private readonly repo: ISubscriptionRepository,
    @inject('ISubscriptionPlanService')
    private readonly planService: ISubscriptionPlanService,
    @inject('ITenantService')
    private readonly tenantService: ITenantService,
    @inject('DbSharedService')
    private readonly db: DbSharedService,
    @inject('MockPaymentProvider')
    private readonly paymentProvider: MockPaymentProvider,
    @inject('SubscriptionService')
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // JOB 2: Subscription Renewals
  // ────────────────────────────────────────────────────────────────────────────

  processRenewals = async (): Promise<void> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const due = await this.repo.findDueForRenewal(new Date(), client);
      logger.info(`[RenewalJob] Found ${due.length} subscriptions due for renewal`);

      for (const subscription of due) {
        try {
          const plan = await this.planService.findByIdWithDetails(subscription.plan_id);
          if (!plan) {
            logger.warn(`[RenewalJob] Plan not found for subscription ${subscription.id}`);
            continue;
          }

          const now = new Date();
          const newPeriodStart = subscription.current_period_end ?? now;
          const newPeriodEnd = this.addBillingInterval(newPeriodStart, plan.billing_interval);

          // Update subscription period dates first
          await this.repo.updateSubscription(
            subscription.id,
            {
              current_period_start: newPeriodStart,
              current_period_end: newPeriodEnd,
              status: 'active',
            },
            client,
          );

          // Generate and process renewal invoice
          const updatedSub = await this.repo.findById(subscription.id, client);
          if (!updatedSub) continue;

          if (parseFloat(plan.price) > 0) {
            const invoice = await this.subscriptionService.createAndPayInvoice(
              updatedSub,
              plan,
              client,
            );
            logger.info(
              `[RenewalJob] Renewed subscription ${subscription.id}, invoice status: ${invoice.status}`,
            );
          } else {
            logger.info(
              `[RenewalJob] Renewed free subscription ${subscription.id} — no invoice`,
            );
          }
        } catch (err) {
          logger.error(`[RenewalJob] Failed for subscription ${subscription.id}:`, err);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[RenewalJob] Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // JOB 3: Downgrade Processing
  // ────────────────────────────────────────────────────────────────────────────

  processDowngrades = async (): Promise<void> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const due = await this.repo.findDueForDowngrade(new Date(), client);
      logger.info(`[DowngradeJob] Found ${due.length} subscriptions due for downgrade`);

      for (const subscription of due) {
        try {
          if (!subscription.scheduled_plan_id) continue;

          const newPlan = await this.planService.findByIdWithDetails(
            subscription.scheduled_plan_id,
          );
          if (!newPlan) {
            logger.warn(`[DowngradeJob] Scheduled plan not found for sub ${subscription.id}`);
            await this.repo.updateSubscription(
              subscription.id,
              { scheduled_plan_id: null },
              client,
            );
            continue;
          }

          const now = new Date();
          const newPeriodStart = subscription.current_period_end ?? now;
          const newPeriodEnd = this.addBillingInterval(newPeriodStart, newPlan.billing_interval);

          // Apply the new plan
          await this.repo.updateSubscription(
            subscription.id,
            {
              plan_id: subscription.scheduled_plan_id,
              scheduled_plan_id: null,
              current_period_start: newPeriodStart,
              current_period_end: newPeriodEnd,
              status: 'active',
            },
            client,
          );

          // Activate scheduled entitlements
          await this.repo.activateScheduledFeatureFlags(subscription.tenant_id, client);
          await this.repo.activateScheduledTenantLimits(subscription.tenant_id, client);

          // Update tenant plan label
          await this.tenantService.updateTenantById(
            subscription.tenant_id,
            { subscription_plan: newPlan.name.toLowerCase() },
            client,
          );

          // Generate renewal invoice at new (lower) rate
          const updatedSub = await this.repo.findById(subscription.id, client);
          if (updatedSub && parseFloat(newPlan.price) > 0) {
            await this.subscriptionService.createAndPayInvoice(updatedSub, newPlan, client);
          }

          logger.info(
            `[DowngradeJob] Downgraded subscription ${subscription.id} to plan ${newPlan.name}`,
          );
        } catch (err) {
          logger.error(`[DowngradeJob] Failed for subscription ${subscription.id}:`, err);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[DowngradeJob] Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // JOB 4: Payment Retries
  // ────────────────────────────────────────────────────────────────────────────

  processPaymentRetries = async (): Promise<void> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const pastDue = await this.repo.findPastDueForRetry(new Date(), client);
      logger.info(`[PaymentRetryJob] Found ${pastDue.length} past_due subscriptions to retry`);

      for (const subscription of pastDue) {
        try {
          const openInvoices = await this.repo.findOpenInvoicesBySubscriptionId(
            subscription.id,
            client,
          );

          for (const invoice of openInvoices) {
            const attemptCount = await this.repo.countPaymentAttemptsByInvoiceId(
              invoice.id,
              client,
            );

            if (attemptCount >= MAX_PAYMENT_ATTEMPTS) {
              // Exhausted retries — suspend subscription
              await this.repo.updateSubscription(
                subscription.id,
                { status: 'suspended' },
                client,
              );
              await this.repo.updateInvoice(invoice.id, { status: 'uncollectible' }, client);
              logger.warn(
                `[PaymentRetryJob] Subscription ${subscription.id} suspended after ${attemptCount} attempts`,
              );
              continue;
            }

            // Retry the payment
            const result = await this.paymentProvider.processPayment(
              invoice.amount,
              invoice.currency,
              subscription.tenant_id,
            );

            await this.repo.createPayment(
              {
                invoice_id: invoice.id,
                tenant_id: subscription.tenant_id,
                amount: invoice.amount,
                currency: invoice.currency,
                status: result.status,
                provider: 'mock',
                provider_payment_id: result.id,
                failure_reason: result.failure_reason,
                attempt_number: attemptCount + 1,
                processed_at: new Date(),
              },
              client,
            );

            if (result.status === 'succeeded') {
              await this.repo.updateInvoice(invoice.id, { status: 'paid', paid_at: new Date() }, client);
              await this.repo.updateSubscription(subscription.id, { status: 'active' }, client);
              logger.info(
                `[PaymentRetryJob] Retry succeeded for subscription ${subscription.id}`,
              );
            } else {
              logger.warn(
                `[PaymentRetryJob] Retry attempt ${attemptCount + 1} failed for subscription ${subscription.id}`,
              );
            }
          }
        } catch (err) {
          logger.error(`[PaymentRetryJob] Failed for subscription ${subscription.id}:`, err);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[PaymentRetryJob] Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // JOB 5: Expired Cancellation Processing
  // ────────────────────────────────────────────────────────────────────────────

  processExpiredCancellations = async (): Promise<void> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const cancelled = await this.repo.findCancelledPastPeriodEnd(new Date(), client);
      logger.info(
        `[ExpiredSubscriptionJob] Found ${cancelled.length} cancelled subscriptions past period end`,
      );

      for (const subscription of cancelled) {
        try {
          await this.repo.updateSubscription(
            subscription.id,
            { status: 'expired', expires_at: subscription.current_period_end ?? new Date() },
            client,
          );

          logger.info(
            `[ExpiredSubscriptionJob] Expired subscription ${subscription.id}`,
          );
        } catch (err) {
          logger.error(
            `[ExpiredSubscriptionJob] Failed for subscription ${subscription.id}:`,
            err,
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[ExpiredSubscriptionJob] Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private addBillingInterval = (date: Date, interval: 'month' | 'year'): Date => {
    const result = new Date(date);
    if (interval === 'year') {
      result.setFullYear(result.getFullYear() + 1);
    } else {
      result.setMonth(result.getMonth() + 1);
    }
    return result;
  };
}

export default SubscriptionJobService;
