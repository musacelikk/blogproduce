import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create(createContactDto);
    return this.contactRepository.save(contact);
  }

  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  }

  async markAsRead(id: string): Promise<Contact> {
    await this.contactRepository.update(id, { isRead: true });
    return this.findOne(id);
  }

  async markAsUnread(id: string): Promise<Contact> {
    await this.contactRepository.update(id, { isRead: false });
    return this.findOne(id);
  }

  async getUnreadCount(): Promise<number> {
    return this.contactRepository.count({
      where: { isRead: false },
    });
  }
}

