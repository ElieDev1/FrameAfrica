import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Password hashing with Argon2id (documents/05-Security-Design.md §3.1).
 * Plaintext is never stored or logged.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB (OWASP baseline)
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  /** Returns false on mismatch or malformed hash — never throws to the caller. */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
