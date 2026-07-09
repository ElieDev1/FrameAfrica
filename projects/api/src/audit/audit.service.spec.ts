import type { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

function build() {
  const prisma = { auditLog: { create: jest.fn(), findMany: jest.fn() } };
  return { service: new AuditService(prisma as unknown as PrismaService), prisma };
}

describe('AuditService', () => {
  it('records an entry', async () => {
    const { service, prisma } = build();
    prisma.auditLog.create.mockResolvedValue({});
    await service.record({ actorId: 'u1', action: 'user.roles_changed', targetId: 'u2' });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('never throws when the write fails (best-effort)', async () => {
    const { service, prisma } = build();
    prisma.auditLog.create.mockRejectedValue(new Error('db down'));
    await expect(service.record({ action: 'x' })).resolves.toBeUndefined();
  });

  it('lists entries with actor and mapped fields', async () => {
    const { service, prisma } = build();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'a1',
        action: 'account.erased',
        targetType: 'user',
        targetId: 'u1',
        meta: null,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        actor: { id: 'u1', displayName: 'Aline' },
      },
    ]);
    const res = await service.list();
    expect(res[0]).toMatchObject({
      action: 'account.erased',
      createdAt: '2026-02-01T00:00:00.000Z',
      actor: { id: 'u1', displayName: 'Aline' },
    });
  });
});
