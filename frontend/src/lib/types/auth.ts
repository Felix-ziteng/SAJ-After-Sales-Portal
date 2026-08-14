export type Role = "TECHNICIAN" | "MANAGER" | "WAREHOUSE" | "ADMIN" | "VIEWER";

export const ALL_ROLES: Role[] = ["TECHNICIAN", "MANAGER", "WAREHOUSE", "ADMIN", "VIEWER"];

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  department: string;
  roles: Role[];
}
