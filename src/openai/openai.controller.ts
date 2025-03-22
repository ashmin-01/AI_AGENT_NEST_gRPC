/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OpenAIService } from './openai.service';

@Controller()
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @GrpcMethod('OpenAIService', 'EvaluateResponse')
  async evaluateResponse(data: {
    messageHistory: string;
    agentAnswer: string;
    companyData: string;
    idealAnswer: string;
    model?: string;
  }): Promise<{ response: string }> {
    try {
      const { messageHistory, agentAnswer, companyData, idealAnswer, model } =
        data;
      const result = await this.openAIService.evaluateResponse(
        messageHistory,
        agentAnswer,
        companyData,
        idealAnswer,
        model,
      );
      return { response: result };
    } catch (error) {
      console.error('Error in EvaluateResponse:', error.message || error);
      throw new Error('Error processing the evaluation request');
    }
  }
}
