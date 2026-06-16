type Role = {
  id: string;
  name: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
  deleted: Date;
};

type RolePermission = {
  id: string;
  role_id: string;
  permission_id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
  deleted: Date;
};

export { Role, RolePermission };
export default Role;
