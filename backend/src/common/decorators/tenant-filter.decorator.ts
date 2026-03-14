import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantFilter {
  organizationId?: string;
  projectId?: string;
}

/**
 * Decorator to get tenant filter from request
 * Use this in services to ensure tenant isolation
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantFilter => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantFilter || {};
  },
);

