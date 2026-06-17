import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import ISubscriptionService, {
  SubscriptionWithDetails,
  CheckoutResult,
  SubscriptionProvisionResult,
} from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import MockPaymentProvider from '@/module/subscription/infrastructure/mock-payment.provider.js';
import Subscription, {
  Invoice,
  CheckoutSession,
} from '@/module/subscription/domain/entities/subscription.entity.js';
import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';

const MAX_PAYMENT_ATTEMPTS = 3;
const CHECKOUT_SESSION_TTL_MINUTES = 30;

@injectable()
class SubscriptionService implements ISubscriptionService {
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
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CHECKOUT
  // ────────────────────────────────────────────────────────────────────────────

  createCheckoutSession = async (tenantId: string, planId: string): Promise<CheckoutResult> => {
    const plan = await this.planService.findByIdWithDetails(planId);
    if (!plan) throw new ApiError('Subscription plan not found', httpStatus.NOT_FOUND);
    if (!plan.is_active)
      throw new ApiError('Subscription plan is not available', httpStatus.BAD_REQUEST);

    const expiresAt = new Date(Date.now() + CHECKOUT_SESSION_TTL_MINUTES * 60_000);
    const session = await this.repo.createCheckoutSession({
      tenant_id: tenantId,
      plan_id: planId,
      status: 'pending',
      expires_at: expiresAt,
      completed_at: null,
    });

    return { session, plan };
  };

  completeCheckout = async (
    tenantId: string,
    sessionId: string,
  ): Promise<SubscriptionProvisionResult> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const session = await this.repo.findCheckoutSessionById(sessionId, client);
      if (!session) throw new ApiError('Checkout session not found', httpStatus.NOT_FOUND);
      if (session.tenant_id !== tenantId)
        throw new ApiError('Checkout session does not belong to this tenant', httpStatus.FORBIDDEN);
      if (session.status !== 'pending')
        throw new ApiError(`Checkout session is already ${session.status}`, httpStatus.CONFLICT);
      if (new Date() > session.expires_at)
        throw new ApiError('Checkout session has expired', httpStatus.GONE);

      const plan = await this.planService.findByIdWithDetails(session.plan_id);
      if (!plan) throw new ApiError('Plan not found', httpStatus.NOT_FOUND);

      // Check for existing active subscription
      const existing = await this.repo.findActiveByTenantId(tenantId, client);

      let subscription: Subscription;
      let invoice: Invoice | null = null;

      if (!existing) {
        // ── Brand new subscriber ──────────────────────────────────────────
        const { subscription: sub, invoice: inv } = await this.provisionNewSubscription(
          tenantId,
          plan,
          client,
        );
        subscription = sub;
        invoice = inv;
      } else {
        // ── Already subscribed — treat as upgrade ─────────────────────────
        const { subscription: sub, invoice: inv } = await this.performUpgrade(
          existing,
          plan,
          client,
        );
        subscription = sub;
        invoice = inv;
      }

      // Mark session completed
      await this.repo.updateCheckoutSession(
        sessionId,
        { status: 'completed', completed_at: new Date() },
        client,
      );

      // Update tenant record
      await this.tenantService.updateTenantById(
        tenantId,
        { subscription_plan: plan.name.toLowerCase() },
        client,
      );

      const featureFlags = await this.repo.findActiveFeatureFlags(tenantId, client);
      const limits = await this.repo.findActiveTenantLimits(tenantId, client);

      await client.query('COMMIT');

      return { subscription, plan, feature_flags: featureFlags, limits, invoice };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────────────────────────

  getCurrentSubscription = async (tenantId: string): Promise<SubscriptionWithDetails | null> => {
    const subscription = await this.repo.findActiveByTenantId(tenantId);
    if (!subscription) return null;

    const plan = await this.planService.findByIdWithDetails(subscription.plan_id);
    if (!plan) throw new ApiError('Plan not found', httpStatus.NOT_FOUND);

    const scheduledPlan = subscription.scheduled_plan_id
      ? await this.planService.findByIdWithDetails(subscription.scheduled_plan_id)
      : null;

    const featureFlags = await this.repo.findActiveFeatureFlags(tenantId);
    const limits = await this.repo.findActiveTenantLimits(tenantId);
    const invoice = await this.repo.findInvoiceBySubscriptionId(subscription.id);
    return {
      subscription,
      plan,
      scheduled_plan: scheduledPlan,
      feature_flags: featureFlags,
      limits,
      invoice,
    };
  };

  getSubscriptionHistory = async (tenantId: string): Promise<Subscription[]> => {
    return this.repo.findAllByTenantId(tenantId);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // UPGRADE — immediate effect
  // ────────────────────────────────────────────────────────────────────────────

  upgrade = async (tenantId: string, planId: string): Promise<SubscriptionProvisionResult> => {
    const plan = await this.planService.findByIdWithDetails(planId);
    if (!plan) throw new ApiError('Subscription plan not found', httpStatus.NOT_FOUND);
    if (!plan.is_active) throw new ApiError('Plan is not available', httpStatus.BAD_REQUEST);

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const existing = await this.repo.findActiveByTenantId(tenantId, client);
      if (!existing) throw new ApiError('No active subscription found', httpStatus.NOT_FOUND);
      if (existing.plan_id === planId)
        throw new ApiError('Already subscribed to this plan', httpStatus.CONFLICT);

      const currentPlan = await this.planService.findByIdWithDetails(existing.plan_id);
      if (!currentPlan) throw new ApiError('Current plan not found', httpStatus.NOT_FOUND);

      if (parseFloat(plan.price) < parseFloat(currentPlan.price)) {
        throw new ApiError(
          'Use the downgrade endpoint for plan downgrades',
          httpStatus.BAD_REQUEST,
        );
      }

      const { subscription, invoice } = await this.performUpgrade(existing, plan, client);

      await this.tenantService.updateTenantById(
        tenantId,
        { subscription_plan: plan.name.toLowerCase() },
        client,
      );

      const featureFlags = await this.repo.findActiveFeatureFlags(tenantId, client);
      const limits = await this.repo.findActiveTenantLimits(tenantId, client);

      await client.query('COMMIT');

      return { subscription, plan, feature_flags: featureFlags, limits, invoice };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // DOWNGRADE — scheduled for next billing period
  // ────────────────────────────────────────────────────────────────────────────

  downgrade = async (
    tenantId: string,
    planId: string,
  ): Promise<{ subscription: Subscription; scheduled_plan: SubscriptionPlan }> => {
    const plan = await this.planService.findByIdWithDetails(planId);
    if (!plan) throw new ApiError('Subscription plan not found', httpStatus.NOT_FOUND);
    if (!plan.is_active) throw new ApiError('Plan is not available', httpStatus.BAD_REQUEST);

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const existing = await this.repo.findActiveByTenantId(tenantId, client);
      if (!existing) throw new ApiError('No active subscription found', httpStatus.NOT_FOUND);
      if (existing.plan_id === planId)
        throw new ApiError('Already subscribed to this plan', httpStatus.CONFLICT);

      const currentPlan = await this.planService.findByIdWithDetails(existing.plan_id);
      if (!currentPlan) throw new ApiError('Current plan not found', httpStatus.NOT_FOUND);

      if (parseFloat(plan.price) >= parseFloat(currentPlan.price)) {
        throw new ApiError('Use the upgrade endpoint for plan upgrades', httpStatus.BAD_REQUEST);
      }

      // Schedule the downgrade — current plan stays active until period end
      const subscription = await this.repo.updateSubscription(
        existing.id,
        { scheduled_plan_id: planId },
        client,
      );

      // Pre-schedule the future entitlements (effective_from = period_end)
      const periodEnd = existing.current_period_end ?? new Date();
      await this.repo.scheduleFutureFeatureFlags(tenantId, plan.features, periodEnd, client);
      await this.repo.schedulesFutureTenantLimits(tenantId, plan.limits, periodEnd, client);

      await client.query('COMMIT');

      return { subscription, scheduled_plan: plan };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CANCEL — keeps access until period end
  // ────────────────────────────────────────────────────────────────────────────

  cancel = async (tenantId: string): Promise<Subscription> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const existing = await this.repo.findActiveByTenantId(tenantId, client);
      if (!existing) throw new ApiError('No active subscription found', httpStatus.NOT_FOUND);
      if (existing.status === 'cancelled')
        throw new ApiError('Subscription is already cancelled', httpStatus.CONFLICT);

      const subscription = await this.repo.updateSubscription(
        existing.id,
        {
          status: 'cancelled',
          cancel_at_period_end: true,
          cancelled_at: new Date(),
        },
        client,
      );

      // Schedule feature flag / limit expiry at period end
      if (existing.current_period_end) {
        await this.repo.expireFeatureFlags(tenantId, existing.current_period_end, client);
        await this.repo.expireTenantLimits(tenantId, existing.current_period_end, client);
      }

      await client.query('COMMIT');
      return subscription;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // REACTIVATE — un-cancel a subscription
  // ────────────────────────────────────────────────────────────────────────────

  reactivate = async (tenantId: string): Promise<SubscriptionProvisionResult> => {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Find the most recent cancelled subscription for this tenant
      const history = await this.repo.findAllByTenantId(tenantId, client);
      const lastCancelled = history.find((s) => s.status === 'cancelled');

      if (!lastCancelled)
        throw new ApiError('No cancelled subscription found', httpStatus.NOT_FOUND);

      const now = new Date();
      const periodEnd = lastCancelled.current_period_end;

      if (periodEnd && now > periodEnd) {
        throw new ApiError(
          'Subscription has already expired. Please start a new subscription.',
          httpStatus.GONE,
        );
      }

      const plan = await this.planService.findByIdWithDetails(lastCancelled.plan_id);
      if (!plan) throw new ApiError('Plan not found', httpStatus.NOT_FOUND);

      const subscription = await this.repo.updateSubscription(
        lastCancelled.id,
        {
          status: 'active',
          cancel_at_period_end: false,
          cancelled_at: null,
        },
        client,
      );

      // Restore feature flags and limits (clear effective_until)
      const featureFlags = await this.repo.setActiveFeatureFlags(tenantId, plan.features, client);
      const limits = await this.repo.setActiveTenantLimits(tenantId, plan.limits, client);

      await this.tenantService.updateTenantById(
        tenantId,
        { subscription_plan: plan.name.toLowerCase() },
        client,
      );

      await client.query('COMMIT');

      return { subscription, plan, feature_flags: featureFlags, limits, invoice: null };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // INVOICES
  // ────────────────────────────────────────────────────────────────────────────

  getInvoices = async (tenantId: string): Promise<Invoice[]> => {
    return this.repo.findInvoicesByTenantId(tenantId);
  };

  getInvoiceById = async (tenantId: string, invoiceId: string): Promise<Invoice | null> => {
    const invoice = await this.repo.findInvoiceById(invoiceId);
    if (!invoice) return null;
    if (invoice.tenant_id !== tenantId)
      throw new ApiError('Invoice not found', httpStatus.NOT_FOUND);
    return invoice;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Provision a brand-new subscription for a tenant that has never subscribed.
   * All plans (including free) activate immediately as 'active'.
   * Free plan (price = 0) creates a £0 paid invoice for record-keeping.
   */
  private provisionNewSubscription = async (
    tenantId: string,
    plan: SubscriptionPlan,
    client: any,
  ): Promise<{ subscription: Subscription; invoice: Invoice | null }> => {
    const now = new Date();
    const currentPeriodEnd = this.addBillingInterval(now, plan.billing_interval);

    const subscription = await this.repo.createSubscription(
      {
        tenant_id: tenantId,
        plan_id: plan.id,
        status: 'active',
        starts_at: now,
        expires_at: null,
        cancelled_at: null,
        trial_ends_at: null,
        current_period_start: now,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        scheduled_plan_id: null,
        renewed_from_id: null,
        metadata: null,
      },
      client,
    );

    // Set feature flags and limits immediately for all plans
    await this.repo.setActiveFeatureFlags(tenantId, plan.features, client);
    await this.repo.setActiveTenantLimits(tenantId, plan.limits, client);

    // Free plan (price = 0): create a £0 paid invoice for audit trail
    // Paid plans: process real payment
    let invoice: Invoice | null = null;
    if (parseFloat(plan.price) > 0) {
      invoice = await this.createAndPayInvoice(subscription, plan, client);
    } else {
      invoice = await this.repo.createInvoice(
        {
          tenant_id: tenantId,
          subscription_id: subscription.id,
          amount: 0,
          currency: plan.currency,
          status: 'paid',
          due_date: now,
          paid_at: now,
          period_start: now,
          period_end: currentPeriodEnd,
          description: `${plan.name} plan subscription`,
          idempotency_key: `sub_${subscription.id}_period_${now.toISOString().slice(0, 10)}`,
        },
        client,
      );
    }

    return { subscription, invoice };
  };

  /**
   * Upgrade an existing subscription immediately.
   * Old subscription is expired, new one created.
   */
  private performUpgrade = async (
    existing: Subscription,
    newPlan: SubscriptionPlan,
    client: any,
  ): Promise<{ subscription: Subscription; invoice: Invoice | null }> => {
    const now = new Date();

    // Expire old subscription
    await this.repo.updateSubscription(existing.id, { status: 'expired', expires_at: now }, client);

    // Calculate new period (prorated from now)
    const newPeriodEnd = this.addBillingInterval(now, newPlan.billing_interval);

    const subscription = await this.repo.createSubscription(
      {
        tenant_id: existing.tenant_id,
        plan_id: newPlan.id,
        status: 'active',
        starts_at: now,
        expires_at: null,
        cancelled_at: null,
        trial_ends_at: null,
        current_period_start: now,
        current_period_end: newPeriodEnd,
        cancel_at_period_end: false,
        scheduled_plan_id: null,
        renewed_from_id: existing.id,
        metadata: null,
      },
      client,
    );

    // Replace entitlements immediately
    await this.repo.setActiveFeatureFlags(existing.tenant_id, newPlan.features, client);
    await this.repo.setActiveTenantLimits(existing.tenant_id, newPlan.limits, client);

    let invoice: Invoice | null = null;
    if (parseFloat(newPlan.price) > 0) {
      invoice = await this.createAndPayInvoice(subscription, newPlan, client);
    }

    return { subscription, invoice };
  };

  /**
   * Creates an invoice and processes payment immediately.
   * If payment fails, invoice becomes 'open' and subscription becomes 'past_due'.
   */
  createAndPayInvoice = async (
    subscription: Subscription,
    plan: SubscriptionPlan,
    client: any,
  ): Promise<Invoice> => {
    const now = new Date();
    const idempotencyKey = `sub_${subscription.id}_period_${(subscription.current_period_start ?? now).toISOString().slice(0, 10)}`;

    // Idempotency check — query by the dedicated idempotency_key text column,
    // NOT by id (which is UUID — passing a non-UUID string would silently
    // abort the entire transaction in PostgreSQL).
    const existing = await this.repo.findInvoiceByIdempotencyKey(idempotencyKey, client);
    if (existing) return existing;

    let invoice = await this.repo.createInvoice(
      {
        tenant_id: subscription.tenant_id,
        subscription_id: subscription.id,
        amount: parseFloat(plan.price),
        currency: plan.currency,
        status: 'open',
        due_date: now,
        paid_at: null,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
        description: `${plan.name} plan — ${plan.billing_interval}ly`,
        idempotency_key: idempotencyKey,
      },
      client,
    );

    // Process payment via mock provider
    const paymentResult = await this.paymentProvider.processPayment(
      invoice.amount,
      invoice.currency,
      subscription.tenant_id,
    );

    const payment = await this.repo.createPayment(
      {
        invoice_id: invoice.id,
        tenant_id: subscription.tenant_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: paymentResult.status,
        provider: 'mock',
        provider_payment_id: paymentResult.id,
        failure_reason: paymentResult.failure_reason,
        attempt_number: 1,
        processed_at: new Date(),
      },
      client,
    );

    if (payment.status === 'succeeded') {
      invoice = await this.repo.updateInvoice(
        invoice.id,
        { status: 'paid', paid_at: new Date() },
        client,
      );
    } else {
      // Payment failed — mark subscription as past_due
      invoice = await this.repo.updateInvoice(invoice.id, { status: 'open' }, client);
      await this.repo.updateSubscription(subscription.id, { status: 'past_due' }, client);
    }

    return invoice;
  };

  /**
   * Add a billing interval (month or year) to a date.
   */
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

export default SubscriptionService;
