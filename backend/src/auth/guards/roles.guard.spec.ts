import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user.entity';
import { PUBLIC_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function guardWith(metadata: Record<string, unknown>) {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows an admin through an admin-only route', () => {
    const guard = guardWith({ [ROLES_KEY]: [UserRole.ADMIN] });
    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('blocks a normal user from an admin-only route', () => {
    // This was the privilege-escalation hole: any authenticated user could call
    // every /admin route, including PATCH /admin/users/:id/role.
    const guard = guardWith({ [ROLES_KEY]: [UserRole.ADMIN] });
    expect(() => guard.canActivate(contextFor({ role: UserRole.USER }))).toThrow(ForbiddenException);
  });

  it('blocks an unauthenticated request', () => {
    const guard = guardWith({ [ROLES_KEY]: [UserRole.ADMIN] });
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('lets @Public() routes bypass the role check', () => {
    const guard = guardWith({ [PUBLIC_KEY]: true, [ROLES_KEY]: [UserRole.ADMIN] });
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });

  it('is a no-op when no roles are declared', () => {
    const guard = guardWith({});
    expect(guard.canActivate(contextFor({ role: UserRole.USER }))).toBe(true);
  });
});
