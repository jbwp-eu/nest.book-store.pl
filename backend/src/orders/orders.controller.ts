import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrdersService } from './orders.service';
import { ChatService } from '../chat/chat.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly chatService: ChatService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('mine')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.findMine(user);
  }

  @Put(':id/deliver')
  @UseGuards(JwtAuthGuard, AdminGuard)
  markDelivered(@Param('id') id: string) {
    return this.ordersService.markDelivered(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Get(':orderId/chat-messages')
  @UseGuards(JwtAuthGuard)
  findChatMessages(
    @Param('orderId') orderId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.findByOrderId(orderId, user);
  }

  @Get(':id')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }
}
