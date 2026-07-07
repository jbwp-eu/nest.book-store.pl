import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './chat-message.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ChatMessage, Order, User]),
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
