import { Global, Module } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import { MicroserviceController } from './microservice.controller';
@Global()
@Module({
  providers: [MicroserviceService],
  controllers: [MicroserviceController],
  exports: [MicroserviceService]
})
export class MicroserviceModule {}
