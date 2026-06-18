import ITenantRepository from '@/module/tenant/domian/interfaces/tenant.repository.interface.js';
import TenantRepositoryImpl from '@/module/tenant/infrastructure/repository/tenant.repository.js';
import { DependencyContainer } from 'tsyringe';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import TenantService from '@/module/tenant/service/tenant.service.js';
import ITenantController from '@/module/tenant/domian/interfaces/tenant.controller.interface.js';
import TenantController from '@/module/tenant/interface/tenant.controller.js';

const registerTenantModule = (container: DependencyContainer) => {
  container.register<ITenantRepository>('ITenantRepository', TenantRepositoryImpl);
  container.register<ITenantService>('ITenantService', TenantService);
  container.register<ITenantController>('ITenantController', TenantController);
};

export default registerTenantModule;
