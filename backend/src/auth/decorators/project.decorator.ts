import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Project } from '../../entities/project.entity';

export const CurrentProject = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Project => {
    const request = ctx.switchToHttp().getRequest();
    return request.project;
  },
);

