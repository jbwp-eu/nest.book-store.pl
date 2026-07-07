import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../orders/order.entity';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Order])],
  // `providers` to tablica, w której deklarujemy serwisy (i inne klasy dostarczające zależności) dostępne w tym module.
  // Dzięki temu NestJS może je wstrzykiwać (dependency injection) do innych klas/serwisów należących do tego modułu.
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
