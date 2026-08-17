import type { Role } from "@/lib/types/auth";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: number;
  email: string;
  displayName: string;
  department: string | null;
  status: UserStatus;
  roles: Role[];
  createdAt: string;
  locked: boolean;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  department?: string;
  roles: Role[];
  password: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  department?: string;
  status?: UserStatus;
  roles?: Role[];
  newPassword?: string;
  unlock?: boolean;
}
