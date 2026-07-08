import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from './account.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type { AuthResult, LoginInput, RegisterInput, SafeUser } from './auth.types';

const withRoles = {
  roles: { include: { role: true } },
} satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof withRoles }>;

/**
 * A precomputed Argon2id hash (same cost params as PasswordService) with no
 * corresponding real password. Verifying against it when the email is unknown
 * or has no password keeps login's response time constant either way, so
 * timing can't be used to enumerate registered emails.
 */
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$CjwQMz9TxglcQ96CXNValw$uH5k7HEziD/YzWgnwZmkCfTA64NpOqE+Bvz5QuRmG3U';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly account: AccountService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwords.hash(input.password);
    let user: UserWithRoles;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          passwordHash,
          roles: {
            create: [
              {
                role: {
                  connectOrCreate: {
                    where: { name: RoleName.reader },
                    create: { name: RoleName.reader },
                  },
                },
              },
            ],
          },
        },
        include: withRoles,
      });
    } catch (error) {
      // The findUnique check above doesn't close the race between two
      // concurrent registrations for the same email — the unique constraint
      // is the real guard, so translate its violation to the same 409.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    // Send the verification email, but don't fail signup if delivery hiccups —
    // the reader can request a fresh link later.
    try {
      await this.account.sendVerification(user.id, user.email);
    } catch (error) {
      this.logger.error(`Failed to send verification email for ${user.id}`, error as Error);
    }

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
      include: withRoles,
    });

    // Always verify — against the real hash if we have one, otherwise a fixed
    // dummy hash — so response time doesn't reveal whether the email exists.
    const passwordOk = await this.passwords.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      input.password,
    );

    if (!user || !user.passwordHash || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueSession(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const rotated = await this.tokens.rotateRefreshToken(rawRefreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
      include: withRoles,
    });
    if (!user || user.deletedAt || user.status !== UserStatus.active) {
      throw new UnauthorizedException('Account is not active');
    }

    const roles = rolesOf(user);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      roles,
    });

    return {
      user: toSafeUser(user, roles),
      accessToken,
      refreshToken: rotated.token,
      refreshExpiresAt: rotated.expiresAt,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.tokens.revokeToken(rawRefreshToken);
  }

  private async issueSession(user: UserWithRoles): Promise<AuthResult> {
    const roles = rolesOf(user);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      roles,
    });
    const refresh = await this.tokens.issueRefreshToken(user.id);

    return {
      user: toSafeUser(user, roles),
      accessToken,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  }
}

function rolesOf(user: UserWithRoles): string[] {
  return user.roles.map((membership) => membership.role.name);
}

function toSafeUser(user: UserWithRoles, roles: string[]): SafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roles,
    mustChangePassword: user.mustChangePassword,
  };
}
