import SubscriptionPlanService from '@/module/subscription/application/services/subscription-plan.service.js';
import SubscriptionService from '@/module/subscription/application/services/subscription.service.js';
import ISubscriptionPlanController from '@/module/subscription/domain/interfaces/subscription-plan.controller.interface.js';
import ISubscriptionPlanRepository from '@/module/subscription/domain/interfaces/subscription-plan.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import ISubscriptionService from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import SubscriptionPlanRepository from '@/module/subscription/infrastructure/repository/subscription-plan.repository.js';
import SubscriptionPlanController from '@/module/subscription/interfaces/controller/subscription-plan.controller.js';
import SubscriptionRepository from '@/module/subscription/infrastructure/repository/subscription.repository.js';
import SubscriptionController from '@/module/subscription/interfaces/controller/subscription.controller.js';
import { DependencyContainer } from 'tsyringe';

export default function registerSubscriptionModule(container: DependencyContainer) {
  container.registerSingleton<ISubscriptionPlanRepository>(
    'ISubscriptionPlanRepository',
    SubscriptionPlanRepository,
  );
  container.registerSingleton<ISubscriptionPlanService>(
    'ISubscriptionPlanService',
    SubscriptionPlanService,
  );
  container.registerSingleton<ISubscriptionPlanController>(
    'ISubscriptionPlanController',
    SubscriptionPlanController,
  );
  container.registerSingleton<ISubscriptionRepository>(
    'ISubscriptionRepository',
    SubscriptionRepository,
  );
  container.registerSingleton<ISubscriptionService>('ISubscriptionService', SubscriptionService);
  container.registerSingleton<ISubscriptionController>(
    'ISubscriptionController',
    SubscriptionController,
  );
}
