import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly cloudFront: CloudFrontClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_BUCKET_REGION_2');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_2');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_KEY_2');

    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined;

    this.s3 = new S3Client({ region, credentials });
    this.cloudFront = new CloudFrontClient({ region, credentials });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const imageName = 'aws' + randomBytes(32).toString('hex');
    const bucket = this.configService.get<string>('AWS_BUCKET_NAME_2');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: imageName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return imageName;
  }

  async deleteFile(imageName: string): Promise<void> {
    const bucket = this.configService.get<string>('AWS_BUCKET_NAME_2');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: imageName,
      }),
    );

    const distributionId = this.configService.get<string>(
      'CLOUDFRONT_DISTRIBUTION_ID',
    );

    if (distributionId) {
      await this.cloudFront.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: imageName + Date.now(),
            Paths: { Quantity: 1, Items: ['/' + imageName] },
          },
        }),
      );
    }
  }
}
