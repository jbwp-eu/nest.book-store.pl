import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { MailService } from '../common/mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Message } from './message.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateContactDto) {
    const insertResult = await this.messageRepository.insert({
      email: dto.email,
      text: dto.text,
    });

    const messageId = insertResult.identifiers[0]?.id as string | undefined;
    const message = messageId
      ? await this.messageRepository.findOne({ where: { id: messageId } })
      : null;

    if (!message) {
      throw new BadRequestException(
        this.i18n.t('messages.failedToCreateMessage'),
      );
    }

    const info = await this.mailService.sendContactMessage(
      message.email,
      message.text,
    );

    return {
      message: this.i18n.t('messages.contactMessageSent'),
      info: info.messageId,
    };
  }
}
