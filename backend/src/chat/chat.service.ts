import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import type { CurrentUserPayload } from '../auth/current-user.interface';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { ChatMessage } from './chat-message.entity';
import type { ChatMessageResponse } from './chat.types';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  roomForOrder(orderId: string): string {
    return `order:${orderId}`;
  }

  extractToken(client: Socket): string | null {
    const tokenFromAuth = client.handshake.auth?.token;
    if (typeof tokenFromAuth === 'string' && tokenFromAuth.length > 0) {
      return tokenFromAuth;
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string') {
      return authorization.replace(/^Bearer\s+/i, '');
    }

    return null;
  }

  async authenticateSocket(client: Socket): Promise<CurrentUserPayload> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException(this.i18n.t('messages.unauthorized'));
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(this.i18n.t('messages.unauthorized'));
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('messages.unauthorized'));
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }

  async assertCanAccessOrder(
    user: CurrentUserPayload,
    orderId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { User: true },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    if (!user.isAdmin && order.User?.id !== user.id) {
      throw new ForbiddenException(this.i18n.t('messages.forbidden'));
    }

    return order;
  }

  async findByOrderId(
    orderId: string,
    user: CurrentUserPayload,
  ): Promise<ChatMessageResponse[]> {
    await this.assertCanAccessOrder(user, orderId);

    const messages = await this.chatMessageRepository.find({
      where: { order: { id: orderId } },
      relations: { sender: true, order: true },
      order: { createdAt: 'ASC' },
    });

    return messages.map((message) => this.toResponse(message));
  }

  async createMessage(params: {
    orderId: string;
    senderUserId: string;
    content: string;
  }): Promise<ChatMessageResponse> {
    const message = this.chatMessageRepository.create({
      order: { id: params.orderId },
      sender: { id: params.senderUserId },
      content: params.content.trim(),
    });

    const saved = await this.chatMessageRepository.save(message);
    const withRelations = await this.chatMessageRepository.findOne({
      where: { id: saved.id },
      relations: { sender: true, order: true },
    });

    if (!withRelations) {
      throw new Error('Failed to create chat message');
    }

    return this.toResponse(withRelations);
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.chatMessageRepository.delete({ order: { id: orderId } });
  }

  toResponse(
    message: ChatMessage,
    clientMessageId?: string | null,
  ): ChatMessageResponse {
    return {
      id: message.id,
      orderId: message.order.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        isAdmin: message.sender.isAdmin,
      },
      ...(clientMessageId !== undefined ? { clientMessageId } : {}),
    };
  }
}
