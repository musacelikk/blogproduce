import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';

export const ROLES_KEY = 'roles';

/** Restrict a route (or controller) to the given roles. Requires RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';

/** Opt a single route out of a controller-level guard. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
