import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CmsController } from './cms.controller';
import type { CmsDraftService } from './cms-draft.service';

const user: AuthenticatedUser = { id: 'u1', roles: ['journalist'] };

function build() {
  const drafts = {
    createDraft: jest.fn().mockResolvedValue({ id: 'a1' }),
    listMyDrafts: jest.fn().mockResolvedValue([{ id: 'a1' }]),
    getMyDraft: jest.fn().mockResolvedValue({ id: 'a1' }),
    updateDraft: jest.fn().mockResolvedValue({ id: 'a1' }),
    submitDraft: jest.fn().mockResolvedValue({ id: 'a1', status: 'ready' }),
  };
  const controller = new CmsController(drafts as unknown as CmsDraftService);
  return { controller, drafts };
}

describe('CmsController', () => {
  it('creates a draft for the current user', async () => {
    const { controller, drafts } = build();
    const dto = { title: 'A new draft', categoryId: 'c1' };
    const res = await controller.create(user, dto);
    expect(drafts.createDraft).toHaveBeenCalledWith('u1', dto);
    expect(res.data).toEqual({ id: 'a1' });
  });

  it('lists only the current user drafts', async () => {
    const { controller, drafts } = build();
    const res = await controller.listMine(user);
    expect(drafts.listMyDrafts).toHaveBeenCalledWith('u1');
    expect(res.data).toEqual([{ id: 'a1' }]);
  });

  it('passes the user id and article id through on get/update/submit', async () => {
    const { controller, drafts } = build();
    await controller.getOne(user, 'a1');
    await controller.update(user, 'a1', { title: 'Updated title' });
    await controller.submit(user, 'a1');
    expect(drafts.getMyDraft).toHaveBeenCalledWith('u1', 'a1');
    expect(drafts.updateDraft).toHaveBeenCalledWith('u1', 'a1', { title: 'Updated title' });
    expect(drafts.submitDraft).toHaveBeenCalledWith('u1', 'a1');
  });
});
