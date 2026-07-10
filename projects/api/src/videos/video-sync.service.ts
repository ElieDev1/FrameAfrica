import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { VideosService } from './videos.service';

const TICK_MS = 60 * 60_000; // pull the channel's uploads hourly

/**
 * In-process YouTube sync. Mirrors `SchedulerService`: a lightweight interval
 * refreshes the video cache so channel uploads appear on-site automatically.
 * A no-op until an admin configures the API key + channel id.
 */
@Injectable()
export class VideoSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoSyncService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly videos: VideosService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.timer.unref?.(); // don't hold the process open just for this
    void this.tick(); // pull once at boot
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.videos.sync();
      if (result.synced > 0) {
        this.logger.log(`Synced ${result.synced} videos from YouTube`);
      }
    } finally {
      this.running = false;
    }
  }
}
