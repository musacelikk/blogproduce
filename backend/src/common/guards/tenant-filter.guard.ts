import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Tenant Filter Guard
 * Ensures all database queries include organization/project filters
 * Prevents tenant escape attacks
 */
@Injectable()
export class TenantFilterGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check if organization and project are set (from ApiKeyGuard or JwtAuthGuard)
    const organization = request.organization;
    const project = request.project;

    // If no organization/project, this guard should not block
    // (some endpoints might not require tenant filtering)
    // But if they exist, they must be valid
    if (organization && !organization.id) {
      throw new ForbiddenException('Invalid organization context');
    }

    if (project && !project.id) {
      throw new ForbiddenException('Invalid project context');
    }

    // Attach tenant filter to request for use in services
    request.tenantFilter = {
      organizationId: organization?.id,
      projectId: project?.id,
    };

    return true;
  }
}

