export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  token?: string;
}

/** The user shape safe to return to clients — never includes secrets. */
export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  /** True when the account is on a generated password and must set a new one. */
  mustChangePassword: boolean;
  /** True when TOTP two-factor is enabled on the account. */
  twoFactorEnabled: boolean;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
