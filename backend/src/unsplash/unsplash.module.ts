import { Module } from '@nestjs/common';
import { UnsplashService } from './unsplash.service';
import { UnsplashController } from './unsplash.controller';

@Module({
  providers: [UnsplashService],
  controllers: [UnsplashController],
  exports: [UnsplashService],
})
export class UnsplashModule {}

