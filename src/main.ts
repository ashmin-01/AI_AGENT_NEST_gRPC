import { config } from 'dotenv';
import { resolve } from 'path';

// Load `.env` from the project directory and override system variables
config({ path: resolve(__dirname, '../.env'), override: true });

console.log(
  'Loaded OpenAI API Key:',
  process.env.OPENAI_API_KEY ? '✔️ Key Found' : '❌ Key Missing',
);

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'microservice',
        protoPath: 'src/proto/microservice.proto',
        url: 'localhost:5000',
      },
    },
  );
  await app.listen();
}
bootstrap();
