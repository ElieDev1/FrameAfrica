import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import { LikesModule } from './likes/likes.module';
import { LiveModule } from './live/live.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FollowsModule } from './follows/follows.module';
import { HistoryModule } from './history/history.module';
import { FeedModule } from './feed/feed.module';
import { SearchModule } from './search/search.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AuditModule } from './audit/audit.module';
import { TipsModule } from './tips/tips.module';
import { VideosModule } from './videos/videos.module';
import { CommentsModule } from './comments/comments.module';
import { BillingModule } from './billing/billing.module';
import { AdsModule } from './ads/ads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Baseline anonymous-read limit (documents/04-API-Design.md §10); routes that
    // need a tighter limit (e.g. auth attempts) override it with @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ContentModule,
    MediaModule,
    LikesModule,
    LiveModule,
    BookmarksModule,
    FollowsModule,
    HistoryModule,
    FeedModule,
    SearchModule,
    PrivacyModule,
    AuditModule,
    TipsModule,
    VideosModule,
    CommentsModule,
    BillingModule,
    AdsModule,
    NotificationsModule,
    NewsletterModule,
    InquiriesModule,
    AnalyticsModule,
    AiModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
