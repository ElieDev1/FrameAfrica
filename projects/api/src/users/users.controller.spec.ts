import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

describe('UsersController', () => {
  it('returns the current user profile in the standard envelope', async () => {
    const profile = { id: 'u1', roles: ['reader'] };
    const getProfile = jest.fn().mockResolvedValue(profile);
    const controller = new UsersController({ getProfile } as unknown as UsersService);

    const user: AuthenticatedUser = { id: 'u1', roles: ['reader'] };
    const res = await controller.me(user);

    expect(getProfile).toHaveBeenCalledWith('u1');
    expect(res.data).toBe(profile);
  });
});
