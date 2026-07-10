import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdPlacement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface HouseAdView {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  placement: AdPlacement;
}

export interface HouseAdAdmin extends HouseAdView {
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

/**
 * House ads (documents/14 §4) — admin-managed creatives served into labelled ad
 * slots. A real ad-sales server (advertisers/campaigns/targeting/billing) is the
 * later replacement behind the same serve endpoint.
 */
@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pick an active ad for a placement (random among active) and count an impression. */
  async serve(placement: AdPlacement): Promise<HouseAdView | null> {
    const ads = await this.prisma.houseAd.findMany({
      where: { placement, isActive: true },
      select: { id: true, title: true, imageUrl: true, linkUrl: true, placement: true },
    });
    if (ads.length === 0) return null;
    const ad = ads[Math.floor(Math.random() * ads.length)];
    this.prisma.houseAd
      .update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } })
      .catch(() => undefined);
    return ad;
  }

  /** Record a click and return the destination for redirect. */
  async click(id: string): Promise<string> {
    const ad = await this.prisma.houseAd.findUnique({ where: { id }, select: { linkUrl: true } });
    if (!ad) throw new NotFoundException('Ad not found');
    this.prisma.houseAd
      .update({ where: { id }, data: { clicks: { increment: 1 } } })
      .catch(() => undefined);
    return ad.linkUrl;
  }

  async list(): Promise<HouseAdAdmin[]> {
    const rows = await this.prisma.houseAd.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.imageUrl,
      linkUrl: r.linkUrl,
      placement: r.placement,
      isActive: r.isActive,
      impressions: r.impressions,
      clicks: r.clicks,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async create(input: {
    title: string;
    linkUrl: string;
    imageUrl?: string;
    placement: AdPlacement;
  }): Promise<{ id: string }> {
    const ad = await this.prisma.houseAd.create({
      data: {
        title: input.title,
        linkUrl: input.linkUrl,
        imageUrl: input.imageUrl || null,
        placement: input.placement,
      },
      select: { id: true },
    });
    return ad;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.houseAd.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.houseAd.delete({ where: { id } });
  }
}
