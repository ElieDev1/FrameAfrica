import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { CmsEditorService } from './cms-editor.service';

const TICK_MS = 60_000; // check for due scheduled articles every minute

/**
 * In-process publisher for scheduled/embargoed articles (documents/07 §5). A
 * lightweight interval flips articles whose `embargoUntil` has passed to
 * `published`. Single-instance friendly; swap for a shared queue when the API
 * scales horizontally.
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly editor: CmsEditorService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.timer.unref?.(); // don't hold the process open just for this
    void this.tick(); // catch anything already due at boot
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running) return; // never overlap ticks
    this.running = true;
    try {
      const n = await this.editor.publishDue();
      if (n > 0) this.logger.log(`Published ${n} scheduled article(s)`);
    } catch (error) {
      this.logger.error('Scheduler tick failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}
