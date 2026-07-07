import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getStoreConfig() {
    return { currency: 'PLN' as const };
  }
}
