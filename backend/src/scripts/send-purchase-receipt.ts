import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MailService } from '../common/mail/mail.service';

async function main() {
  const orderId = process.argv[2];
  const language = process.argv[3] === 'en' ? 'en' : 'pl';
  if (!orderId) {
    console.error('Usage: npm run mail:receipt -- <orderId> [pl|en]');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const mail = app.get(MailService);

  try {
    const result = await mail.sendPurchaseReceipt(orderId, language);
    console.log('OK:', result);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
