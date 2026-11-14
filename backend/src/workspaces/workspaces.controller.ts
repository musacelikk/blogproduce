import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(user, createWorkspaceDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, user, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User, @Body() body?: { force?: boolean }) {
    return this.workspacesService.remove(id, user, body?.force || false);
  }

  @Post(':id/api-keys')
  createApiKey(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.workspacesService.createApiKey(id, user, createApiKeyDto);
  }

  @Get(':id/api-keys')
  listApiKeys(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.listApiKeys(id, user);
  }

  @Post(':id/api-keys/:keyId/revoke')
  revokeApiKey(@Param('id') id: string, @Param('keyId') keyId: string, @CurrentUser() user: User) {
    return this.workspacesService.revokeApiKey(id, user, keyId);
  }

  @Post(':id/api-keys/:keyId/rotate')
  rotateApiKey(@Param('id') id: string, @Param('keyId') keyId: string, @CurrentUser() user: User) {
    return this.workspacesService.rotateApiKey(id, user, keyId);
  }

  @Post(':id/webhooks')
  createWebhook(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    return this.workspacesService.createWebhook(id, user, createWebhookDto);
  }

  @Get(':id/webhooks')
  listWebhooks(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.listWebhooks(id, user);
  }

  @Patch(':id/webhooks/:webhookId')
  updateWebhook(
    @Param('id') id: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: User,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.workspacesService.updateWebhook(id, user, webhookId, updateWebhookDto);
  }

  @Delete(':id/webhooks/:webhookId')
  deleteWebhook(
    @Param('id') id: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.deleteWebhook(id, user, webhookId);
  }
}
