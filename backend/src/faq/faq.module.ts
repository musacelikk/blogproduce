import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQ } from '../entities/faq.entity';
import { FAQController } from './faq.controller';
import { FAQService } from './faq.service';

@Module({
  imports: [TypeOrmModule.forFeature([FAQ])],
  controllers: [FAQController],
  providers: [FAQService],
  exports: [FAQService],
})
export class FAQModule {}

