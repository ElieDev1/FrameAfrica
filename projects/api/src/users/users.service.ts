import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** Public byline identity — the author page a reader reaches from a story. */
  authorSlug: string | null;
  bio: string | null;
  jobTitle: string | null;
  roles: string[];
  emailVerified: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  /** Paid access through this instant (ISO), or null. `isSubscriber` is the
   *  derived truth the UI should read — it accounts for a lapsed date. */
  subscribedUntil: string | null;
  isSubscriber: boolean;
}

const withRoles = {
  roles: { include: { role: true } },
} satisfies Prisma.UserInclude;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The authenticated user's own profile. */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: withRoles,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toProfile(user);
  }

  /** Update the caller's own display name, avatar, and public byline bio. */
  async updateProfile(userId: string, input: UpdateProfileDto): Promise<UserProfile> {
    const data: Prisma.UserUpdateInput = {};

    if (input.displayName !== undefined) {
      const name = input.displayName.trim();
      if (name.length < 2) {
        throw new BadRequestException('Display name must be at least 2 characters');
      }
      data.displayName = name;
    }

    if (input.avatarUrl !== undefined) {
      const url = input.avatarUrl.trim();
      if (url === '') {
        data.avatarUrl = null;
      } else if (/^https?:\/\/.+/i.test(url)) {
        data.avatarUrl = url;
      } else {
        throw new BadRequestException('Avatar must be a valid http(s) URL');
      }
    }

    // The byline bio is the writer's own words about themselves; an empty value
    // clears it rather than storing a blank line.
    if (input.bio !== undefined) data.bio = input.bio.trim() || null;
    if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle.trim() || null;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: withRoles,
    });
    return this.toProfile(user);
  }

  private toProfile(user: Prisma.UserGetPayload<{ include: typeof withRoles }>): UserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      authorSlug: user.authorSlug,
      bio: user.bio,
      jobTitle: user.jobTitle,
      roles: user.roles.map((membership) => membership.role.name),
      emailVerified: user.emailVerifiedAt !== null,
      mustChangePassword: user.mustChangePassword,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt.toISOString(),
      subscribedUntil: user.subscribedUntil?.toISOString() ?? null,
      // The one truth the UI reads: a date in the past is not a subscriber.
      isSubscriber: user.subscribedUntil !== null && user.subscribedUntil > new Date(),
    };
  }
}
