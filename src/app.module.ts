import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIController } from './openai/openai.controller';
import { OpenAIService } from './openai/openai.service';
import { OpenaiModule } from './openai/openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [AppController, OpenAIController],
  providers: [AppService, OpenAIService],
})
export class AppModule {}
