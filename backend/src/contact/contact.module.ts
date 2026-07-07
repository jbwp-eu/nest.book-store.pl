import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../common/mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { Message } from './message.entity';

@Module({
  imports: [MailModule, TypeOrmModule.forFeature([Message])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
