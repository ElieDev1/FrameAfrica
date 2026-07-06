import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

type ServiceMock = {
  listArticles: jest.Mock;
  getArticleBySlug: jest.Mock;
  getCategoryTree: jest.Mock;
};

function mockResponse(): Pick<Response, 'status'> {
  return { status: jest.fn() };
}

describe('ContentController', () => {
  let controller: ContentController;
  let service: ServiceMock;

  beforeEach(async () => {
    service = {
      listArticles: jest.fn(),
      getArticleBySlug: jest.fn(),
      getCategoryTree: jest.fn(),
    };

    const ref = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [{ provide: ContentService, useValue: service }],
    }).compile();

    controller = ref.get(ContentController);
  });

  it('wraps the article list with a pagination envelope', async () => {
    service.listArticles.mockResolvedValue({
      items: [{ slug: 's1' }],
      nextCursor: 'x',
      hasMore: true,
    });

    const res = await controller.listArticles({});

    expect(res.data).toEqual([{ slug: 's1' }]);
    expect(res.meta.pagination).toEqual({ nextCursor: 'x', hasMore: true });
    expect(res.meta.requestId).toEqual(expect.any(String));
  });

  it('wraps a single article and passes the slug through', async () => {
    service.getArticleBySlug.mockResolvedValue({ slug: 's1', isLocked: false });
    const httpRes = mockResponse();

    const res = await controller.getArticle('s1', httpRes as Response);

    expect(res.data).toMatchObject({ slug: 's1' });
    expect(service.getArticleBySlug).toHaveBeenCalledWith('s1');
    expect(httpRes.status).not.toHaveBeenCalled();
  });

  it('returns 402 for a locked (premium, unsubscribed) article', async () => {
    service.getArticleBySlug.mockResolvedValue({ slug: 's1', isLocked: true });
    const httpRes = mockResponse();

    const res = await controller.getArticle('s1', httpRes as Response);

    expect(res.data).toMatchObject({ slug: 's1' });
    expect(httpRes.status).toHaveBeenCalledWith(402);
  });

  it('wraps the category tree', async () => {
    service.getCategoryTree.mockResolvedValue([{ slug: 'news' }]);

    const res = await controller.getCategories();

    expect(res.data).toEqual([{ slug: 'news' }]);
  });
});
