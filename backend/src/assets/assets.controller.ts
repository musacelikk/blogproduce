import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { memoryStorage } from 'multer';
import { detectFileType, isAllowedUpload, ALLOWED_UPLOAD_MIMES } from './file-type.util';
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
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (req, file, cb) => {
        // First pass only — `file.mimetype` is whatever the client claimed. The
        // authoritative check reads the file's magic bytes below, once the
        // buffer exists.
        cb(null, ALLOWED_UPLOAD_MIMES.includes(file.mimetype));
      },
    }),
  )
  async upload(
    @CurrentUser() user: User,
    @Body('workspaceId') workspaceId: string,
    @Body('alt') alt?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // These were plain `throw new Error(...)`, which Nest turns into a 500 with
    // no message — a client could not tell a missing field from a server fault.
    if (!file) {
      throw new BadRequestException(
        'Dosya bulunamadı. Desteklenen türler: JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, PDF (en fazla 10MB).',
      );
    }
    if (!workspaceId) {
      throw new BadRequestException('workspaceId zorunludur');
    }

    /**
     * Trust the bytes, not the header. A caller can label anything
     * `image/png`; without this an HTML or SVG payload could be stored and then
     * served from our own asset domain, which is stored XSS. `detectFileType`
     * reads the magic bytes and we take *its* answer as the content type.
     */
    const detected = detectFileType(file.buffer);
    if (!detected || !isAllowedUpload(detected.mime)) {
      throw new BadRequestException(
        'Dosya içeriği desteklenen bir görsel/medya biçimiyle eşleşmiyor. ' +
          'JPEG, PNG, WebP, GIF, AVIF, MP4, WebM veya PDF yükleyin.',
      );
    }
    file.mimetype = detected.mime;

    return this.assetsService.uploadAsset(user, workspaceId, file, alt);
  }

  @Get()
  async findAll(@CurrentUser() user: User, @Query('workspaceId') workspaceId?: string) {
    return this.assetsService.findAll(user, workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.assetsService.findOne(user, id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.assetsService.deleteAsset(user, id);
    return { message: 'Görsel silindi' };
  }
}
