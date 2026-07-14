import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { uniqueAuthorSlug } from '../common/author-slug';
import { MailerService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateTemporaryPassword } from './password-generator';

export interface AdminUserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  status: UserStatus;
  mustChangePassword: boolean;
  /** Locked out after too many failed sign-ins; an admin must unlock. */
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListUsersFilter {
  q?: string;
  role?: RoleName;
  status?: UserStatus;
}

const withRoles = { roles: { include: { role: true } } } satisfies Prisma.UserInclude;
type UserRow = Prisma.UserGetPayload<{ include: typeof withRoles }>;

/** Role memberships to replace a user's roles with (connectOrCreate each). */
function roleCreate(roles: RoleName[]): Prisma.UserRoleCreateWithoutUserInput[] {
  return roles.map((name) => ({
    role: { connectOrCreate: { where: { name }, create: { name } } },
  }));
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly mailer: MailerService,
  ) {}

  /** All non-deleted users, newest first, optionally filtered. */
  async list(filter: ListUsersFilter = {}): Promise<AdminUserView[]> {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.role) where.roles = { some: { role: { name: filter.role } } };
    if (filter.q) {
      where.OR = [
        { email: { contains: filter.q, mode: 'insensitive' } },
        { displayName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.user.findMany({
      where,
      include: withRoles,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toView);
  }

  /**
   * Create an account with a generated temporary password. The plaintext is
   * returned to the admin exactly once (to hand over) and never stored; the
   * user must set their own password at first sign-in.
   */
  async create(input: {
    email: string;
    displayName: string;
    roles: RoleName[];
  }): Promise<{ user: AdminUserView; temporaryPassword: string }> {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    try {
      const created = await this.prisma.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          passwordHash,
          authorSlug: await uniqueAuthorSlug(this.prisma, input.displayName),
          mustChangePassword: true,
          emailVerifiedAt: new Date(), // admin-vouched account
          roles: { create: roleCreate(input.roles) },
        },
        include: withRoles,
      });
      return { user: toView(created), temporaryPassword };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  /** Replace a user's role set. */
  async setRoles(id: string, roles: RoleName[]): Promise<AdminUserView> {
    await this.assertUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { roles: { deleteMany: {}, create: roleCreate(roles) } },
      include: withRoles,
    });
    return toView(updated);
  }

  /**
   * Grant or revoke paid access. Until self-serve payments (MoMo/Airtel) land,
   * an admin comps a subscription by setting `subscribedUntil`; `null` revokes.
   */
  async setSubscription(id: string, until: Date | null): Promise<AdminUserView> {
    await this.assertUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { subscribedUntil: until },
      include: withRoles,
    });
    return toView(updated);
  }

  /** Activate / suspend a user (soft-delete uses `deleted`). */
  async setStatus(id: string, status: UserStatus): Promise<AdminUserView> {
    await this.assertUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status, deletedAt: status === UserStatus.deleted ? new Date() : null },
      include: withRoles,
    });
    return toView(updated);
  }

  /**
   * Reset a user's password: generate a new temporary one, flag it for change at
   * next login, and both email it to the user AND return it once to the admin so
   * they can hand it over directly (email may not be configured). The account is
   * unusable with it beyond the forced change, so this is a one-time secret.
   */
  async resetPassword(
    id: string,
  ): Promise<{ email: string; temporaryPassword: string; emailed: boolean }> {
    const user = await this.assertUser(id);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.mailer.sendTemporaryPassword(user.email, temporaryPassword);
    return { email: user.email, temporaryPassword, emailed: true };
  }

  /** Clear a brute-force lockout: reset the failure counter and unlock. */
  async unlock(id: string): Promise<AdminUserView> {
    await this.assertUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedAt: null },
      include: withRoles,
    });
    return toView(updated);
  }

  private async assertUser(id: string): Promise<{ email: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}

function toView(user: UserRow): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roles: user.roles.map((m) => m.role.name),
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    locked: user.lockedAt !== null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
