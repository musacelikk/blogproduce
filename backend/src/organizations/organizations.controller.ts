import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateApiKeyDto } from '../workspaces/dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(':organizationId/projects/:projectId/api-keys')
  createApiKey(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.organizationsService.createApiKey(organizationId, projectId, user, createApiKeyDto);
  }

  @Get(':organizationId/projects/:projectId/api-keys')
  listApiKeys(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.organizationsService.listApiKeys(organizationId, projectId, user);
  }

  @Post(':organizationId/projects/:projectId/api-keys/:keyId/revoke')
  revokeApiKey(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
    @CurrentUser() user: User,
  ) {
    return this.organizationsService.revokeApiKey(organizationId, projectId, user, keyId);
  }
}

