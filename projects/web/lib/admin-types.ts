/** Every assignable role (documents/13 §1 roles). */
export const ROLE_NAMES = [
  'reader',
  'journalist',
  'sub_editor',
  'photographer',
  'editor',
  'moderator',
  'ads_manager',
  'admin',
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserFilters {
  q?: string;
  role?: string;
  status?: string;
}
