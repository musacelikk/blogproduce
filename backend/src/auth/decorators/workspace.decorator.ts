import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Workspace } from '../../entities/workspace.entity';

export const CurrentWorkspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Workspace => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspace;
  },
);
