import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public endpoint (no auth required)
  @Post()
  async create(@Body() createContactDto: CreateContactDto) {
    const contact = await this.contactService.create(createContactDto);
    return {
      success: true,
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
      data: contact,
    };
  }

  // Admin endpoints (auth required)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: User) {
    const contacts = await this.contactService.findAll();
    return {
      success: true,
      data: contacts,
    };
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.contactService.getUnreadCount();
    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    const contact = await this.contactService.findOne(id);
    return {
      success: true,
      data: contact,
    };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    const contact = await this.contactService.markAsRead(id);
    return {
      success: true,
      data: contact,
    };
  }

  @Patch(':id/unread')
  @UseGuards(JwtAuthGuard)
  async markAsUnread(@CurrentUser() user: User, @Param('id') id: string) {
    const contact = await this.contactService.markAsUnread(id);
    return {
      success: true,
      data: contact,
    };
  }
}

