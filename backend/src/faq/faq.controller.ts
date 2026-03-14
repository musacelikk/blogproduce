import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FAQService } from './faq.service';
import { CreateFAQDto } from './dto/create-faq.dto';
import { UpdateFAQDto } from './dto/update-faq.dto';
import { FAQType } from '../entities/faq.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('faq')
export class FAQController {
  constructor(private readonly faqService: FAQService) {}

  // Public endpoints (no auth required)
  @Get('public')
  async getPublicFAQs(@Query('type') type?: FAQType) {
    const faqs = await this.faqService.findAll(type);
    return {
      success: true,
      data: faqs,
    };
  }

  // Admin endpoints (auth required)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllFAQs(@CurrentUser() user: User, @Query('type') type?: FAQType) {
    const faqs = await this.faqService.findAllAdmin(type);
    return {
      success: true,
      data: faqs,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getFAQById(@CurrentUser() user: User, @Param('id') id: string) {
    const faq = await this.faqService.findOne(id);
    return {
      success: true,
      data: faq,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createFAQ(@CurrentUser() user: User, @Body() createFAQDto: CreateFAQDto) {
    const faq = await this.faqService.create(createFAQDto);
    return {
      success: true,
      data: faq,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateFAQ(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateFAQDto: UpdateFAQDto,
  ) {
    const faq = await this.faqService.update(id, updateFAQDto);
    return {
      success: true,
      data: faq,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteFAQ(@CurrentUser() user: User, @Param('id') id: string) {
    await this.faqService.delete(id);
    return {
      success: true,
      message: 'FAQ deleted successfully',
    };
  }
}

