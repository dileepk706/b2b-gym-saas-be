import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import Subscription, {
  TenantFeatureFlagRecord,
  TenantLimitRecord,
  Invoice,
  CheckoutSession,
} from '@/module/subscription/domain/entities/subscription.entity.js';

// ── Result shapes returned by the service ─────────────────────────────────────

export interface SubscriptionWithDetails {
  subscription: Subscription;
  plan: SubscriptionPlan;
  scheduled_plan: SubscriptionPlan | null;
  feature_flags: TenantFeatureFlagRecord[];
  limits: TenantLimitRecord[];
  invoice: Invoice;
}

export interface CheckoutResult {
  session: CheckoutSession;
  plan: SubscriptionPlan;
}

export interface SubscriptionProvisionResult {
  subscription: Subscription;
  plan: SubscriptionPlan;
  feature_flags: TenantFeatureFlagRecord[];
  limits: TenantLimitRecord[];
  invoice: Invoice | null;
}

// ── Service interface ──────────────────────────────────────────────────────────

export default interface ISubscriptionService {
  // Checkout flow
  createCheckoutSession(tenantId: string, planId: string): Promise<CheckoutResult>;
  completeCheckout(tenantId: string, sessionId: string): Promise<SubscriptionProvisionResult>;

  // Current state
  getCurrentSubscription(tenantId: string): Promise<SubscriptionWithDetails | null>;
  getSubscriptionHistory(tenantId: string): Promise<Subscription[]>;

  // Plan changes
  upgrade(tenantId: string, planId: string): Promise<SubscriptionProvisionResult>;
  downgrade(
    tenantId: string,
    planId: string,
  ): Promise<{ subscription: Subscription; scheduled_plan: SubscriptionPlan }>;

  // Lifecycle
  cancel(tenantId: string): Promise<Subscription>;
  reactivate(tenantId: string): Promise<SubscriptionProvisionResult>;

  // Invoices
  getInvoices(tenantId: string): Promise<Invoice[]>;
  getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice | null>;
}
