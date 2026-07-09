import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntryInput {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; displayName: string } | null;
}

/**
 * Append-only audit trail for privileged actions (documents/05 §11). `record()`
 * is best-effort — it never throws into the caller, so auditing can't break the
 * action it describes.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntryInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          meta: (entry.meta ?? undefined) as never,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit entry "${entry.action}": ${(error as Error).message}`,
      );
    }
  }

  /** Most-recent privileged actions (admin monitoring). */
  async list(limit = 100): Promise<AuditEntry[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
      include: { actor: { select: { id: true, displayName: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      meta: (r.meta as Record<string, unknown> | null) ?? null,
      createdAt: r.createdAt.toISOString(),
      actor: r.actor,
    }));
  }
}
