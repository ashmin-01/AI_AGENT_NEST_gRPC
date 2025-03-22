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
  }
}
