export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** The user shape safe to return to clients — never includes secrets. */
export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
