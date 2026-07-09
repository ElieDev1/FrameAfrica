/** What a reader can follow. */
export type FollowTarget = 'section' | 'topic';

export interface FollowStatus {
  following: boolean;
}

export interface FollowedSubject {
  id: string;
  name: string;
  slug: string;
}

/** The reader's follows, grouped by kind. */
export interface Follows {
  sections: FollowedSubject[];
  topics: FollowedSubject[];
}
