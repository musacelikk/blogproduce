import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { memoryStorage } from 'multer';
import type { Express } from 'express-serve-static-core';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      fileFilter: (req, file, cb) => {
        // Allow images, videos, and documents
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'video/mp4',
          'video/webm',
          'application/pdf',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('File type not allowed'), false);
        }
      },
    }),
  )
  async upload(
    @CurrentUser() user: User,
    @Body('workspaceId') workspaceId: string,
    @Body('alt') alt?: string,
    @UploadedFile() file?: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!workspaceId) {
      throw new Error('workspaceId is required');
    }

    return this.assetsService.uploadAsset(user, workspaceId, file, alt);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.assetsService.findAll(user, workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assetsService.findOne(user, id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.assetsService.deleteAsset(user, id);
    return { message: 'Asset deleted successfully' };
  }
}

