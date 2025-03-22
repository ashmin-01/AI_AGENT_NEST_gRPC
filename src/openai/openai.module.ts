/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';
@Global()
@Module({
    controllers: [OpenAIController],
    providers: [OpenAIService],
    exports: [OpenAIService]
})
export class OpenAIModule {}
