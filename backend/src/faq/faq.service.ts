import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ, FAQType } from '../entities/faq.entity';
import { CreateFAQDto } from './dto/create-faq.dto';
import { UpdateFAQDto } from './dto/update-faq.dto';

@Injectable()
export class FAQService {
  constructor(
    @InjectRepository(FAQ)
    private faqRepository: Repository<FAQ>,
  ) {}

  async findAll(type?: FAQType): Promise<FAQ[]> {
    const query = this.faqRepository.createQueryBuilder('faq');
    
    if (type) {
      query.where('faq.type = :type', { type });
    }
    
    query
      .andWhere('faq.active = :active', { active: true })
      .orderBy('faq.order', 'ASC')
      .addOrderBy('faq.createdAt', 'DESC');

    return query.getMany();
  }

  async findAllAdmin(type?: FAQType): Promise<FAQ[]> {
    const query = this.faqRepository.createQueryBuilder('faq');
    
    if (type) {
      query.where('faq.type = :type', { type });
    }
    
    query.orderBy('faq.order', 'ASC').addOrderBy('faq.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<FAQ> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new Error('FAQ not found');
    }
    return faq;
  }

  async create(createFAQDto: CreateFAQDto): Promise<FAQ> {
    const faq = this.faqRepository.create(createFAQDto);
    return this.faqRepository.save(faq);
  }

  async update(id: string, updateFAQDto: UpdateFAQDto): Promise<FAQ> {
    await this.faqRepository.update(id, updateFAQDto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.faqRepository.delete(id);
  }
}

