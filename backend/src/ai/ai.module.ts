import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { BlogGeneratorService } from './blog-generator.service';

@Module({
  imports: [ConfigModule],
  providers: [LlmService, BlogGeneratorService],
  exports: [LlmService, BlogGeneratorService],
})
export class AiModule {}
