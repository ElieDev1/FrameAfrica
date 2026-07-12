import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { EngagementTarget } from '@prisma/client';

const TARGETS = new Set<string>(Object.values(EngagementTarget));

/** Validates the `:type` path segment against the EngagementTarget enum. */
@Injectable()
export class ParseTargetPipe implements PipeTransform<string, EngagementTarget> {
  transform(value: string): EngagementTarget {
    if (!TARGETS.has(value)) {
      throw new BadRequestException(
        `Unknown content type "${value}" (expected one of: ${[...TARGETS].join(', ')})`,
      );
    }
    return value as EngagementTarget;
  }
}
