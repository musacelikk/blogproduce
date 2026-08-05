import { getMetadataArgsStorage } from 'typeorm';
import { Post } from './post.entity';

/**
 * Guards the raw column names used in hand-written WHERE clauses (the worker's
 * claimPost and the scheduled-publish claim). Post maps some columns to snake_case
 * and leaves others camelCase — referencing the wrong form only fails at runtime,
 * against a real database.
 */
describe('Post entity column mapping', () => {
  const storage = getMetadataArgsStorage();

  /** The database column name TypeORM will emit for a property. */
  const columnFor = (property: string): string => {
    const args = storage.columns.find(
      (c) => c.target === Post && c.propertyName === property,
    );
    if (!args) throw new Error(`No column metadata for Post.${property}`);
    // No global naming strategy is configured, so an unmapped column keeps its
    // property name verbatim.
    return (args.options?.name as string) ?? property;
  };

  it('keeps createdAt/updatedAt camelCase', () => {
    expect(columnFor('createdAt')).toBe('createdAt');
    expect(columnFor('updatedAt')).toBe('updatedAt');
  });

  it('maps the tenant and lifecycle columns to snake_case', () => {
    expect(columnFor('organizationId')).toBe('organization_id');
    expect(columnFor('projectId')).toBe('project_id');
    expect(columnFor('publishedAt')).toBe('published_at');
    expect(columnFor('scheduledAt')).toBe('scheduled_at');
    expect(columnFor('lastError')).toBe('last_error');
    expect(columnFor('publishedRevisionId')).toBe('published_revision_id');
  });

  it('leaves id and status unmapped', () => {
    expect(columnFor('id')).toBe('id');
    expect(columnFor('status')).toBe('status');
  });
});
