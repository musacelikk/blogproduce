import { Post } from '../../entities/post.entity';
import { PostRevision } from '../../entities/post-revision.entity';

export function sortRevisionsDesc(revisions: PostRevision[]): PostRevision[] {
  return [...revisions].sort((a, b) => b.version - a.version);
}

export function getLatestRevision(revisions: PostRevision[] | undefined | null): PostRevision | null {
  if (!revisions?.length) return null;
  return sortRevisionsDesc(revisions)[0];
}

/**
 * Returns the revision that should be served publicly.
 * Uses publishedRevisionId when set, otherwise falls back to the latest version.
 */
export function getPublishedRevision(post: Post): PostRevision | null {
  if (!post.revisions?.length) return null;

  if (post.publishedRevisionId) {
    const pinned = post.revisions.find((r) => r.id === post.publishedRevisionId);
    if (pinned) return pinned;
  }

  return getLatestRevision(post.revisions);
}
