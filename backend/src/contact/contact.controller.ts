import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SensitiveThrottle } from '../common/throttler/sensitive-throttle.decorator';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(201)
  @SensitiveThrottle()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
