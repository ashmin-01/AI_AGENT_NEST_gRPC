import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'openai',
        protoPath: 'src/proto/openai.proto',
        url: 'localhost:5000',
      },
    },
  );
  await app.listen();
}
bootstrap();
