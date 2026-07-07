import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { Product } from '../product.entity';

export interface CloudFrontConfig {
  keyPairId?: string;
  privateKey?: string;
  baseUrl?: string;
}

/**
 * Funkcja signAssetKey przyjmuje klucz pliku (najczęściej nazwę obrazka lub bannera w S3)
 * oraz konfigurację CloudFront (zawierającą keyPairId, privateKey i baseUrl).
 * Jeżeli klucz zaczyna się od "aws" oraz podane są wszystkie wymagane dane konfiguracyjne,
 * zwraca podpisany (signed) URL do zasobu w CloudFront, ważny przez 7 dni.
 * W przeciwnym razie zwraca oryginalny klucz bez zmian.
 */
function signAssetKey(key: string, config: CloudFrontConfig): string {
  if (
    !key.startsWith('aws') ||
    !config.keyPairId ||
    !config.privateKey ||
    !config.baseUrl
  ) {
    return key;
  }

  const base = config.baseUrl.replace(/\/$/, '');
  return getSignedUrl({
    url: `${base}/${key}`,
    keyPairId: config.keyPairId,
    dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    privateKey: config.privateKey,
  });
}

export function withSignedImages(
  product: Product,
  config: CloudFrontConfig,
): Product {
  return {
    ...product,
    images: product.images.map((image) => signAssetKey(image, config)),
  };
}

export function withSignedBanners(
  product: Product,
  config: CloudFrontConfig,
): Product {
  const banners = [...product.banners];
  if (banners.length > 0) {
    banners[0] = signAssetKey(banners[0], config);
  }
  return { ...product, banners };
}
