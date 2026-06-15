import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import ISubscriptionService, {
  CurrentSubscriptionResult,
  SubscriptionProvisionResult,
} from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import Subscription from '@/module/subscription/domain/entities/subscription.entity.js';

@injectable()
class SubscriptionService implements ISubscriptionService {
  constructor(
    @inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @inject('ISubscriptionPlanService')
    private readonly subscriptionPlanService: ISubscriptionPlanService,
    @inject('ITenantService')
    private readonly tenantService: ITenantService,
    @inject('DbSharedService')
    private readonly dbSharedService: DbSharedService,
  ) {}

  subscribeTenant = async (
    tenantId: string,
    planId: string,
  ): Promise<SubscriptionProvisionResult> => {
    const plan = await this.subscriptionPlanService.findByIdWithDetails(planId);

    if (!plan) throw new ApiError('Subscription plan not found', httpStatus.NOT_FOUND);

    const client = await this.dbSharedService.getClient();

    try {
      await client.query('BEGIN');

      const existingSubscription = await this.subscriptionRepository.findActiveByTenantId(
        tenantId,
        client,
      );

      const tenant = await this.tenantService.updateTenantById(
        tenantId,
        { subscription_plan: plan.name.toLowerCase() },
        client,
      );

      if (!tenant) throw new ApiError('Tenant not found', httpStatus.NOT_FOUND);

      const subscription: Subscription = await this.subscriptionRepository.createOrUpdateSubscription(
        {
          tenant_id: tenantId,
          plan_id: plan.id,
          status: 'active',
          starts_at: new Date(),
          expires_at: null,
          cancelled_at: null,
        },
        client,
      );

      const featureFlags = await this.subscriptionRepository.replaceTenantFeatureFlags(
        tenantId,
        plan.features,
        client,
      );

      const limits = await this.subscriptionRepository.replaceTenantLimits(
        tenantId,
        plan.limits,
        client,
      );

      await client.query('COMMIT');

      return {
        tenant,
        subscription,
        plan,
        feature_flags: featureFlags,
        limits,
        created: !existingSubscription,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  getCurrentSubscription = async (
    tenantId: string,
  ): Promise<CurrentSubscriptionResult | null> => {
    const client = await this.dbSharedService.getClient();

    try {
      const subscription = await this.subscriptionRepository.findActiveByTenantId(
        tenantId,
        client,
      );

      if (!subscription || subscription.status !== 'active' || subscription.cancelled_at) {
        return null;
      }

      const plan = await this.subscriptionPlanService.findByIdWithDetails(subscription.plan_id);
      if (!plan) throw new ApiError('Subscription plan not found', httpStatus.NOT_FOUND);

      const feature_flags = await this.subscriptionRepository.findTenantFeatureFlags(tenantId, client);
      const limits = await this.subscriptionRepository.findTenantLimits(tenantId, client);

      return {
        tenant: { id: tenantId, subscription_plan: plan.name.toLowerCase() },
        subscription,
        plan,
        feature_flags,
        limits,
      };
    } finally {
      client.release();
    }
  };
}

export default SubscriptionService;
