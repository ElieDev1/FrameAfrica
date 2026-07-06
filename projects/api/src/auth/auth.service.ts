import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type { AuthResult, LoginInput, RegisterInput, SafeUser } from './auth.types';

const withRoles = {
  roles: { include: { role: true } },
} satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof withRoles }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
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

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
      include: withRoles,
    });

    const passwordOk = user?.passwordHash
      ? await this.passwords.verify(user.passwordHash, input.password)
      : false;

    if (!user || !passwordOk) {
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
  };
}
