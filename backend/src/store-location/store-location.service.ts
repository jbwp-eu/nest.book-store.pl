import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCoordsForAddress } from '../common/utils/location';

export type StoreLocationDto = {
  name: string;
  latitude: number;
  longitude: number;
};

/** Warsaw — Rondo Dmowskiego 10 (same address as gql STORE_ADDRESS fallback). */
const WARSAW_STORE_FALLBACK = {
  latitude: 52.2299538,
  longitude: 21.0123946,
};

@Injectable()
export class StoreLocationService {
  private readonly logger = new Logger(StoreLocationService.name);

  constructor(private readonly configService: ConfigService) {}

  async getStoreLocation(): Promise<StoreLocationDto> {
    const address = this.configService.get<string>('STORE_ADDRESS') ?? '';
    const apiKey = this.configService.get<string>(
      'GOOGLE_MAPS_API_KEY_geocoding',
    );

    try {
      const coords = await getCoordsForAddress(address, apiKey);
      return {
        name: address,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    } catch (err) {
      this.logger.warn(
        'storeLocation geocoding failed, using static Warsaw coordinates',
        err instanceof Error ? err.message : String(err),
      );
      return {
        name: address,
        ...WARSAW_STORE_FALLBACK,
      };
    }
  }
}
