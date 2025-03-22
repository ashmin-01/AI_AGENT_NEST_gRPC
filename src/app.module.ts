import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIController } from './openai/openai.controller';
import { OpenAIService } from './openai/openai.service';
import { OpenAIModule } from './openai/openai.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [OpenAIModule, ConfigModule.forRoot()], 
  controllers: [AppController, OpenAIController],
  providers: [AppService, OpenAIService],
})
export class AppModule {}
