import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreLocationController } from './store-location.controller';
import { StoreLocationService } from './store-location.service';

@Module({
  imports: [ConfigModule],
  controllers: [StoreLocationController],
  providers: [StoreLocationService],
})
export class StoreLocationModule {}
