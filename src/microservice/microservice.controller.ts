import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MicroserviceService } from './microservice.service';

@Controller()
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

 
  @GrpcMethod('Microservice', 'EvaluateResponseRubric')
  async evaluateResponseRubric(data: {
    messageHistory: { role: string; content: string }[];
    companyData: Record<string, string>;
    agentAnswer: string;
  }): Promise<object> {
    const { messageHistory, companyData, agentAnswer } = data;
    const metrics = await this.microserviceService.evaluateResponseRubric(
      messageHistory,
      companyData,
      agentAnswer,
    );

    return { metrices: metrics };
  }

 
  @GrpcMethod('Microservice', 'EvaluateResponseIdeal')
  async evaluateResponseIdeal(data: {
    messageHistory: { role: string; content: string }[];
    agentAnswer: string;
    idealAnswer: string;
  }): Promise<object> {
    const { messageHistory, agentAnswer, idealAnswer } = data;
    const cases = await this.microserviceService.evaluateResponseIdeal(
      messageHistory,
      agentAnswer,
      idealAnswer,
    );

    return { cases };
  }
}
