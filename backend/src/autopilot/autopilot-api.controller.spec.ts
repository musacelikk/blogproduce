import 'reflect-metadata';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { AutopilotApiController } from './autopilot-api.controller';
import { AutopilotController } from './autopilot.controller';

/**
 * The partner-API routes, read from the decorators themselves.
 *
 * Worth pinning: these are a published contract customers integrate against, and
 * a path typo is invisible until someone's integration 404s. Reflection also
 * catches an accidental collision with `ApiController`, which shares the
 * `api/v1` prefix.
 */
function routesOf(controller: any): Array<{ method: string; path: string }> {
  const prefix = Reflect.getMetadata(PATH_METADATA, controller) ?? '';
  const proto = controller.prototype;

  return Object.getOwnPropertyNames(proto)
    .filter((name) => name !== 'constructor' && typeof proto[name] === 'function')
    .map((name) => {
      const path = Reflect.getMetadata(PATH_METADATA, proto[name]);
      const verb = Reflect.getMetadata(METHOD_METADATA, proto[name]);
      if (path === undefined || verb === undefined) return null;
      return {
        method: RequestMethod[verb],
        path: `${prefix}/${path}`.replace(/\/+/g, '/').replace(/\/$/, ''),
      };
    })
    .filter(Boolean) as Array<{ method: string; path: string }>;
}

describe('partner-API autopilot routes', () => {
  const routes = routesOf(AutopilotApiController);

  it('exposes the full configure-and-drive surface under api/v1', () => {
    expect(routes).toEqual(
      expect.arrayContaining([
        { method: 'GET', path: 'api/v1/sites' },
        { method: 'POST', path: 'api/v1/sites' },
        { method: 'GET', path: 'api/v1/sites/:siteId/autopilot' },
        { method: 'PUT', path: 'api/v1/sites/:siteId/autopilot' },
        { method: 'GET', path: 'api/v1/sites/:siteId/autopilot/topics' },
        { method: 'POST', path: 'api/v1/sites/:siteId/autopilot/topics/plan' },
      ]),
    );
  });

  it('uses no resource:action paths, which Express splits into a param', () => {
    // `posts:generate` needs a guard against typo'd URLs for exactly this
    // reason; plain nested paths avoid the problem rather than working around it.
    for (const route of routes) {
      expect(route.path).not.toMatch(/:[a-zA-Z]+$/);
    }
  });

  it('keeps the dashboard surface on its own prefix', () => {
    // The two controllers authorize different principals, so their paths must
    // not overlap — a dashboard route reachable with an API key would bypass
    // the workspace-owner check.
    const dashboard = routesOf(AutopilotController).map((r) => r.path);
    const api = routes.map((r) => r.path);
    expect(dashboard.every((p) => p.startsWith('autopilot/') || p === 'autopilot')).toBe(true);
    expect(api.every((p) => p.startsWith('api/v1/'))).toBe(true);
    expect(api.filter((p) => dashboard.includes(p))).toEqual([]);
  });
});
