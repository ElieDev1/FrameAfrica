import { NotFoundException } from '@nestjs/common';
import { EngagementTarget } from '@prisma/client';
import type { EngagementService } from '../engagement/engagement.service';
import { LikesService } from './likes.service';

function build() {
  const engagement = { like: jest.fn(), counts: jest.fn() };
  return { service: new LikesService(engagement as unknown as EngagementService), engagement };
}

describe('LikesService', () => {
  it('likes an article through the polymorphic engagement store', async () => {
    const { service, engagement } = build();
    engagement.like.mockResolvedValue({
      liked: true,
      likeCount: 7,
      shareCount: 0,
      commentCount: 0,
    });

    const res = await service.like('u1', 'a1');

    expect(engagement.like).toHaveBeenCalledWith('u1', EngagementTarget.article, 'a1', true);
    expect(res).toEqual({ liked: true, likeCount: 7 });
  });

  it('unlikes an article', async () => {
    const { service, engagement } = build();
    engagement.like.mockResolvedValue({
      liked: false,
      likeCount: 6,
      shareCount: 0,
      commentCount: 0,
    });

    const res = await service.unlike('u1', 'a1');

    expect(engagement.like).toHaveBeenCalledWith('u1', EngagementTarget.article, 'a1', false);
    expect(res).toEqual({ liked: false, likeCount: 6 });
  });

  it('reports the viewer status', async () => {
    const { service, engagement } = build();
    engagement.counts.mockResolvedValue({
      liked: true,
      likeCount: 3,
      shareCount: 1,
      commentCount: 2,
    });

    expect(await service.status('u1', 'a1')).toEqual({ liked: true, likeCount: 3 });
    expect(engagement.counts).toHaveBeenCalledWith(EngagementTarget.article, 'a1', 'u1');
  });

  it('propagates a 404 for an unpublished/unknown article', async () => {
    const { service, engagement } = build();
    engagement.like.mockRejectedValue(new NotFoundException('Content not found'));
    await expect(service.like('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
