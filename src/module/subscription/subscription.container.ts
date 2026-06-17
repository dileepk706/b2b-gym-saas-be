import SubscriptionPlanService from '@/module/subscription/application/services/subscription-plan.service.js';
import SubscriptionService from '@/module/subscription/application/services/subscription.service.js';
import SubscriptionJobService from '@/module/subscription/application/services/subscription-job.service.js';
import ISubscriptionPlanController from '@/module/subscription/domain/interfaces/subscription-plan.controller.interface.js';
import ISubscriptionPlanRepository from '@/module/subscription/domain/interfaces/subscription-plan.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import ISubscriptionService from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import SubscriptionPlanRepository from '@/module/subscription/infrastructure/repository/subscription-plan.repository.js';
import SubscriptionRepository from '@/module/subscription/infrastructure/repository/subscription.repository.js';
import MockPaymentProvider from '@/module/subscription/infrastructure/mock-payment.provider.js';
import SubscriptionPlanController from '@/module/subscription/interfaces/controller/subscription-plan.controller.js';
import SubscriptionController from '@/module/subscription/interfaces/controller/subscription.controller.js';
import { DependencyContainer } from 'tsyringe';

export default function registerSubscriptionModule(container: DependencyContainer) {
  // ── Repositories ────────────────────────────────────────────────────────────
  container.registerSingleton<ISubscriptionPlanRepository>(
    'ISubscriptionPlanRepository',
    SubscriptionPlanRepository,
  );
  container.registerSingleton<ISubscriptionRepository>(
    'ISubscriptionRepository',
    SubscriptionRepository,
  );

  // ── Payment provider ────────────────────────────────────────────────────────
  container.registerSingleton<MockPaymentProvider>('MockPaymentProvider', MockPaymentProvider);

  // ── Services ────────────────────────────────────────────────────────────────
  container.registerSingleton<ISubscriptionPlanService>(
    'ISubscriptionPlanService',
    SubscriptionPlanService,
  );
  container.registerSingleton<ISubscriptionService>('ISubscriptionService', SubscriptionService);

  // Register concrete class token for SubscriptionJobService (needs direct injection)
  container.registerSingleton<SubscriptionService>('SubscriptionService', SubscriptionService);
  container.registerSingleton<SubscriptionJobService>(
    'SubscriptionJobService',
    SubscriptionJobService,
  );

  // ── Controllers ─────────────────────────────────────────────────────────────
  container.registerSingleton<ISubscriptionPlanController>(
    'ISubscriptionPlanController',
    SubscriptionPlanController,
  );
  container.registerSingleton<ISubscriptionController>(
    'ISubscriptionController',
    SubscriptionController,
  );
}
