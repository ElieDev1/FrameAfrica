import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('produces an Argon2id hash that is not the plaintext', async () => {
    const hash = await service.hash('correct horse battery');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('correct horse battery');
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('s3cret-pass');
    await expect(service.verify(hash, 's3cret-pass')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('s3cret-pass');
    await expect(service.verify(hash, 'wrong-pass')).resolves.toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    await expect(service.verify('not-a-hash', 'whatever')).resolves.toBe(false);
  });
});
