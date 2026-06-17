import Subscription, {
  TenantFeatureFlagRecord,
  TenantLimitRecord,
  Invoice,
  Payment,
  CheckoutSession,
} from '@/module/subscription/domain/entities/subscription.entity.js';
import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export default interface ISubscriptionRepository {
  // ── Active subscription lookup ────────────────────────────────────────────
  findActiveByTenantId(tenantId: string, client?: QueryExecutor): Promise<Subscription | null>;
  findById(id: string, client?: QueryExecutor): Promise<Subscription | null>;

  // ── Subscription history ──────────────────────────────────────────────────
  findAllByTenantId(tenantId: string, client?: QueryExecutor): Promise<Subscription[]>;

  // ── Subscription creation ─────────────────────────────────────────────────
  createSubscription(
    data: Omit<Subscription, 'id' | 'created_at'>,
    client?: QueryExecutor,
  ): Promise<Subscription>;

  // ── Subscription updates ──────────────────────────────────────────────────
  updateSubscription(
    id: string,
    data: Partial<Omit<Subscription, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<Subscription>;

  // ── Batch queries for background jobs ────────────────────────────────────
  findDueForRenewal(now: Date, client?: QueryExecutor): Promise<Subscription[]>;
  findPastDueForRetry(now: Date, client?: QueryExecutor): Promise<Subscription[]>;
  findCancelledPastPeriodEnd(now: Date, client?: QueryExecutor): Promise<Subscription[]>;
  findDueForDowngrade(now: Date, client?: QueryExecutor): Promise<Subscription[]>;

  // ── Feature flags ─────────────────────────────────────────────────────────
  findActiveFeatureFlags(
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]>;

  setActiveFeatureFlags(
    tenantId: string,
    features: SubscriptionPlan['features'],
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]>;

  scheduleFutureFeatureFlags(
    tenantId: string,
    features: SubscriptionPlan['features'],
    effectiveFrom: Date,
    client?: QueryExecutor,
  ): Promise<void>;

  expireFeatureFlags(tenantId: string, expiresAt: Date, client?: QueryExecutor): Promise<void>;

  activateScheduledFeatureFlags(
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]>;

  // ── Tenant limits ─────────────────────────────────────────────────────────
  findActiveTenantLimits(tenantId: string, client?: QueryExecutor): Promise<TenantLimitRecord[]>;

  setActiveTenantLimits(
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]>;

  schedulesFutureTenantLimits(
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    effectiveFrom: Date,
    client?: QueryExecutor,
  ): Promise<void>;

  expireTenantLimits(tenantId: string, expiresAt: Date, client?: QueryExecutor): Promise<void>;

  activateScheduledTenantLimits(
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]>;

  // ── Invoices ──────────────────────────────────────────────────────────────
  createInvoice(
    data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
    client?: QueryExecutor,
  ): Promise<Invoice>;

  findInvoiceById(id: string, client?: QueryExecutor): Promise<Invoice | null>;
  findInvoiceByIdempotencyKey(key: string, client?: QueryExecutor): Promise<Invoice | null>;

  findInvoicesByTenantId(tenantId: string, client?: QueryExecutor): Promise<Invoice[]>;
  findInvoiceBySubscriptionId(subscriptionId: string, client?: QueryExecutor): Promise<Invoice>;

  findOpenInvoicesBySubscriptionId(
    subscriptionId: string,
    client?: QueryExecutor,
  ): Promise<Invoice[]>;

  updateInvoice(
    id: string,
    data: Partial<Omit<Invoice, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<Invoice>;

  // ── Payments ──────────────────────────────────────────────────────────────
  createPayment(data: Omit<Payment, 'id' | 'created_at'>, client?: QueryExecutor): Promise<Payment>;

  findPaymentsByInvoiceId(invoiceId: string, client?: QueryExecutor): Promise<Payment[]>;

  countPaymentAttemptsByInvoiceId(invoiceId: string, client?: QueryExecutor): Promise<number>;

  // ── Checkout Sessions ─────────────────────────────────────────────────────
  createCheckoutSession(
    data: Omit<CheckoutSession, 'id' | 'created_at'>,
    client?: QueryExecutor,
  ): Promise<CheckoutSession>;

  findCheckoutSessionById(id: string, client?: QueryExecutor): Promise<CheckoutSession | null>;

  updateCheckoutSession(
    id: string,
    data: Partial<Omit<CheckoutSession, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<CheckoutSession>;
}
