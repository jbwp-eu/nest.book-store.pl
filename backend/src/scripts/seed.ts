 import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from '../seeder/seeder.service';

async function main() {
  const flag = process.argv[2];

  if (flag !== '-i' && flag !== '-d') {
    console.error('Usage: npm run seed -- -i | -d');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const seeder = app.get(SeederService);

  try {
    if (flag === '-i') {
      await seeder.importData();
    } else {
      await seeder.destroyData();
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
