import { container } from 'tsyringe';
import { Pool } from 'pg';
//
import registerGymModule from '@/module/gym/gym.container.js';
import registerUserModule from '@/module/user/user.container.js';
import registerAuthModule from '@/module/token/token.container.js';
import pool from '@/database/connection.js';
import registerTenantModule from '@/module/tenant/tenants.container.js';
import registerOnboardingModule from '@/module/onboarding/onboarding.container.js';
import registerStaffModule from '@/module/staff/staff.container.js';
import registerRoleModule from '@/module/role/role.container.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import registerPermissionModule from '@/module/permissions/permission.container.js';
import registerSubscriptionModule from '@/module/subscription/subscription.container.js';

const registerDependencies = () => {
  container.registerInstance(Pool, pool);
  container.registerSingleton('DbSharedService', DbSharedService);
  registerGymModule(container);
  registerUserModule(container);
  registerAuthModule(container);
  registerTenantModule(container);
  registerOnboardingModule(container);
  registerStaffModule(container);
  registerRoleModule(container);
  registerPermissionModule(container);
  registerSubscriptionModule(container);
};

export default registerDependencies;
export { container };
