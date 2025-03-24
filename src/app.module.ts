import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceController } from './microservice/microservice.controller';
import { MicroserviceModule } from './microservice/microservice.module';

@Module({
  imports: [ConfigModule.forRoot(), MicroserviceModule], 
  controllers: [AppController, MicroserviceController],
  providers: [AppService],
})
export class AppModule {}
