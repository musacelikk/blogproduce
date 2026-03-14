import { Controller, Get, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { UnsplashService } from './unsplash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('unsplash')
@UseGuards(JwtAuthGuard)
export class UnsplashController {
  constructor(private readonly unsplashService: UnsplashService) {}

  @Get('search')
  async searchPhotos(
    @Query('query') query: string,
    @Query('per_page') perPage?: string,
    @Query('page') page?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const perPageNum = perPage ? parseInt(perPage, 10) : 8;
    if (perPageNum < 1 || perPageNum > 30) {
      throw new BadRequestException('per_page must be between 1 and 30');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    if (pageNum < 1) {
      throw new BadRequestException('page must be greater than 0');
    }

    try {
      const photos = await this.unsplashService.searchPhotos(query, perPageNum, pageNum);

      return {
        success: true,
        data: photos,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to search photos',
      );
    }
  }

  @Get('download/:photoId')
  async triggerDownload(@Param('photoId') photoId: string) {
    if (!photoId) {
      throw new BadRequestException('Photo ID is required');
    }

    await this.unsplashService.triggerDownload(photoId);

    return {
      success: true,
      message: 'Download triggered',
    };
  }
}

