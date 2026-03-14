import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(user, createSiteDto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('workspaceId') workspaceId?: string) {
    return this.sitesService.findAll(user, workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sitesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(id, user, updateSiteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sitesService.remove(id, user);
  }
}
