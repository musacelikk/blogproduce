import { PostsService } from './posts.service';
import { PostStatus } from '../entities/post.entity';

/**
 * A post has to carry *both* tenancy scopes.
 *
 * The dashboard filters on `workspace_id`; the partner API filters on
 * `organization_id` + `project_id`. `generate()` populates both, but `create()`
 * — the dashboard's own "new post" path — set only `workspace_id`. So a post
 * written there was invisible on `/api/v1/published/:slug`, which answered the
 * customer's own site with 404 for an article that existed and was published.
 *
 * This is the mirror image of the bug migration 003 repaired in the other
 * direction, and CLAUDE.md states the rule every write path has to keep:
 * populate both, or reintroduce exactly this class of bug.
 */
function buildService() {
  const workspace = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Acme',
    description: null,
    ownerId: 'user-1',
  };

  const saved: any[] = [];
  const organizations: any[] = [];
  const projects: any[] = [];

  const postsRepository = {
    create: (entity: any) => entity,
    save: jest.fn((entity: any) => {
      saved.push(entity);
      return Promise.resolve({ id: 'post-1', ...entity });
    }),
    findOne: jest.fn().mockResolvedValue(null),
  };

  const workspacesRepository = {
    findOne: jest.fn().mockResolvedValue(workspace),
  };

  const organizationRepository = {
    findOne: jest.fn((opts: any) =>
      Promise.resolve(
        organizations.find((o) => o.name === opts?.where?.name && o.ownerId === opts?.where?.ownerId) ??
          null,
      ),
    ),
    create: (entity: any) => entity,
    save: jest.fn((entity: any) => {
      const row = { id: 'org-1', ...entity };
      organizations.push(row);
      return Promise.resolve(row);
    }),
  };

  const projectRepository = {
    findOne: jest.fn((opts: any) =>
      Promise.resolve(projects.find((p) => p.slug === opts?.where?.slug) ?? null),
    ),
    create: (entity: any) => entity,
    save: jest.fn((entity: any) => {
      const row = { id: 'project-1', ...entity };
      projects.push(row);
      return Promise.resolve(row);
    }),
  };

  const service = new PostsService(
    postsRepository as any,
    workspacesRepository as any,
    {} as any, // tags
    {} as any, // revisions
    {} as any, // generation jobs
    organizationRepository as any,
    projectRepository as any,
    {} as any, // sqs
    {} as any, // webhooks
    {} as any, // billing
    {} as any, // html sanitizer
  );

  return { service, workspace, saved, organizations, projects };
}

const user = { id: 'user-1' } as any;

describe('PostsService.create tenancy scopes', () => {
  it('writes organizationId and projectId alongside workspaceId', async () => {
    const { service, workspace, saved } = buildService();

    await service.create(user, {
      workspaceId: workspace.id,
      title: 'Lüks salon dekorasyonu nasıl yapılır',
      slug: 'luks-salon-dekorasyonu-nasil-yapilir',
      status: PostStatus.PUBLISHED,
    } as any);

    expect(saved).toHaveLength(1);
    expect(saved[0].workspaceId).toBe(workspace.id);
    expect(saved[0].organizationId).toBeTruthy();
    expect(saved[0].projectId).toBeTruthy();
  });

  it('bridges through the documented convention: project.slug is the workspace id', async () => {
    const { service, workspace, organizations, projects } = buildService();

    await service.create(user, {
      workspaceId: workspace.id,
      title: 'x',
      slug: 'x',
    } as any);

    expect(organizations[0].name).toBe(`${workspace.name} (${workspace.id})`);
    expect(projects[0].slug).toBe(workspace.id);
  });

  it('reuses the existing organization and project rather than creating a second', async () => {
    const { service, workspace, organizations, projects } = buildService();

    await service.create(user, { workspaceId: workspace.id, title: 'a', slug: 'a' } as any);
    await service.create(user, { workspaceId: workspace.id, title: 'b', slug: 'b' } as any);

    expect(organizations).toHaveLength(1);
    expect(projects).toHaveLength(1);
  });
});
