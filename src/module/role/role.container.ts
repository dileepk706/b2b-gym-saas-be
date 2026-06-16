import RoleRepository from '@/module/role/infrastructure/repository/role.repository.js';
import RoleService from '@/module/role/application/services/role.service.js';
import RoleController from '@/module/role/interfaces/controller/role.controller.js';
import { DependencyContainer } from 'tsyringe';
import RolePermissionService from '@/module/role/application/services/role-permission.service.js';
import RolePermissionRepository from '@/module/role/infrastructure/repository/role-permission.repository.js';

export default function registerRoleModule(container: DependencyContainer) {
  container.registerSingleton('IRoleRepository', RoleRepository);
  container.registerSingleton('IRoleService', RoleService);
  container.registerSingleton('IRoleController', RoleController);
  container.registerSingleton('IRolePermissionService', RolePermissionService);
  container.registerSingleton('IRolePermissionRepository', RolePermissionRepository);
}
