/** The machine-readable copy of a reader's personal data (Law N° 058/2021,
 * `FR-AUTH-8`). Everything the platform holds that is *about the user*. */
export interface DataExport {
  exportedAt: string;
  profile: {
    id: string;
    email: string;
    displayName: string;
    phone: string | null;
    roles: string[];
    createdAt: string;
    lastLoginAt: string | null;
  };
  comments: { body: string; articleId: string; createdAt: string }[];
  bookmarks: { articleId: string; createdAt: string }[];
  follows: { categoryId: string | null; topicId: string | null; createdAt: string }[];
  readingHistory: { articleId: string; viewedAt: string }[];
  likes: { articleId: string; createdAt: string }[];
  notifications: { type: string; title: string; createdAt: string }[];
}
