export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  articleCount: number;
  childCount: number;
}

export interface AdminTopic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  articleCount: number;
}
