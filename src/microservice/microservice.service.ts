import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class MicroserviceService {   

    private readonly apiKey;
    private readonly systemMessageRubric: string;
    private readonly userMessageTemplateRubric: string;
    private readonly systemMessageIdeal: string;
    private readonly userMessageTemplateIdeal: string;


  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️ Warning: API Key is missing. Check if your .env file is loaded correctly.');
    }

    this.systemMessageRubric = `
You are an assistant that evaluates how well the customer service agent answers a user question by considering the provided \
company data and multiple evaluation metrics.

You will be given the conversation history, the company data (information the AI agent is allowed to use), and the AI agent's response, 
each delimited with '####' characters.
Compare the factual content of the submitted answer with the provided company data.
Ignore differences in style, grammar, or punctuation.

Assign a score from 0 to 100 for each of the following metrics, and explain your reasoning for each score:
- Faithfulness: How factually accurate the response is based on company data.
- Completeness: How well the response covers key details from the ideal answer.
- Conciseness: Whether the response avoids unnecessary repetition and remains clear.
- Relevance: How well the response addresses the customer's query.
- Tone & Politeness: Whether the response maintains a professional and customer-friendly tone.`;

    this.userMessageTemplateRubric = `
    Message History: {delimiter}{messageHistory}{delimiter}
    Company Data: {delimiter}{companyData}{delimiter}
    Agent Answer: {delimiter}{agentAnswer}{delimiter}`;

    this.systemMessageIdeal = `
    You are an assistant that evaluates how well the customer service agent's answer compares to the ideal (expert) answer.
    You will be given the conversation history, the ideal answer, and the AI agent's response.  

    Compare the factual content of the submitted answer with the ideal answer.
    Ignore differences in style, grammar, or punctuation.

    The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. \
    Determine which case applies. Answer the question by selecting one of the following options and explain your reasoning for the choice made:
    (A) The submitted answer is a subset of the expert answer and is fully consistent with it.
    (B) The submitted answer is a superset of the expert answer and is fully consistent with it.
    (C) The submitted answer contains all the same details as the expert answer.
    (D) There is a disagreement between the submitted answer and the expert answer.
    (E) The answers differ, but these differences don't matter from the perspective of factuality.
    choice_strings: ABCDE`;

    this.userMessageTemplateIdeal = `
    Message History: {delimiter}{messageHistory}{delimiter}
    Agent Answer: {delimiter}{agentAnswer}{delimiter}
    Ideal answer: {delimiter}{idealAnswer}{delimiter}`;

  }
// ** -- Handles interaction with the ChatOpenAI model, sending a structured conversation history and receiving a formatted AI-generated response. -- **
  async chat(
    messages: { role: string; content: string }[],
    model: string = 'gpt-4o-mini',
    temperature: number = 0,
    maxTokens: number = 4000,
    responseFormat?: any
  ): Promise<object> {
    try {
      const myModel = new ChatOpenAI({
        modelName: model,
        temperature,
        maxTokens,
        apiKey: this.apiKey,
      });
      const modelWithStructure = myModel.withStructuredOutput(responseFormat);
      const formattedMessages = messages.map((msg) => {
        return msg.role === 'system'
          ? new SystemMessage(msg.content)
          : new HumanMessage(msg.content);
      });

      const response = await modelWithStructure.invoke(formattedMessages);
      return response;
    } catch (error) {
      console.error(
        'There was an issue while communicating with the AI service:',
        error,
      );
      return { 'Error with chat process': 'Unable to complete the request. Please check the API configuration or try again later.' };
    }
  }
// ** --- Evaluate Response Based on provided context (data) --- ** 
  async evaluateResponseRubric(
    messageHistory: { role: string; content: string }[],
    companyData: Record<string, string>,
    agentAnswer: string,
  ): Promise<object> {
    const delimiter = '####';
    const userMessage = this.userMessageTemplateRubric
      .replace(/{delimiter}/g, delimiter)
      .replace(/{messageHistory}/g, JSON.stringify(messageHistory))
      .replace(/{companyData}/g, JSON.stringify(companyData))
      .replace(/{agentAnswer}/g, agentAnswer);
  
    const messages = [
      { role: 'system', content: this.systemMessageRubric },
      { role: 'user', content: userMessage },
    ];

    const responseFormat = {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          metrices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'string' },
                score: { type: 'integer', minimum: 0, maximum: 100},
                reason: { type: 'string' },
              },
              required: ['metric', 'score', 'reason'],
            },
          },
        },
        required: ['metrices'],
      },
    };

    try {
      const response = await this.chat(messages, 'gpt-4o-mini', 0, 4000, responseFormat);
      return response;
    } catch (error) {
      console.error('Error during Rubric evaluation:', error);
      return { error: 'Failed to generate evaluation. Please check API key and request format.' };
    }
  }
  
  // ** --- Evaluate Response Based on an Ideal (Expert) Answer --- ** 
  async evaluateResponseIdeal(
    messageHistory: { role: string; content: string }[],
    agentAnswer: string,
    idealAnswer: string,
  ): Promise<object> {
    const delimiter = '####';
    const userMessage = this.userMessageTemplateIdeal
      .replace(/{delimiter}/g, delimiter)
      .replace(/{messageHistory}/g, JSON.stringify(messageHistory))
      .replace(/{agentAnswer}/g, agentAnswer)
      .replace(/{idealAnswer}/g, idealAnswer);
  
    const messages = [
      { role: 'system', content: this.systemMessageIdeal },
      { role: 'user', content: userMessage },
    ];
    const responseFormat = {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          choice: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E'] },
          reason: { type: 'string' },
        },
        required: ['choice', 'reason'],
      },
    };
    
    try {
      const response = await this.chat(messages, 'gpt-4o-mini', 0, 4000, responseFormat);
      console.log("response log (ideal) from service : ", response)
      return response;
    } catch (error) {
      console.error('Error during Ideal evaluation:', error);
      return { error: 'Failed to generate evaluation. Please check API key and request format.' };
    }
  }

  // ** --- Evaluate Response Using Question-Answer Generation (QAG) --- ** 
async evaluateResponseQAG(
  messageHistory: { role: string; content: string }[],
  companyData: Record<string, string>,
  agentAnswer: string
): Promise<object> {
  const delimiter = '####';
  const systemMessageQAG = `
You are an assistant that evaluates how well the customer service agent's answer aligns with the extracted facts.  
You will be given the conversation history, the company data (information the AI agent is allowed to use), and the AI agent's response.  

Your task is to generate between 3 to 7 key questions based on the conversation and check if the agent's response correctly answers them.  

For each generated question, you must assign a score from 0 to 100 based on:  
- Accuracy: Does the response correctly answer the generated question?  
- Completeness: Does it address all key details?  
- Relevance: Does it stay on topic?  

Provide an explanation for the assigned scores.`;

  const userMessage = `
  Message History: ${delimiter}${JSON.stringify(messageHistory)}${delimiter}
  Company Data: ${delimiter}${JSON.stringify(companyData)}${delimiter}
  Agent Answer: ${delimiter}${agentAnswer}${delimiter}
  `;

  const messages = [
    { role: 'system', content: systemMessageQAG },
    { role: 'user', content: userMessage },
  ];

  const responseFormat = {
    type: 'json_object',
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              accuracyScore: { type: 'integer', minimum: 0, maximum: 100 },
              completenessScore: { type: 'integer', minimum: 0, maximum: 100 },
              relevanceScore: { type: 'integer', minimum: 0, maximum: 100 },
              reasoning: { type: 'string' },
            },
            required: ['question', 'accuracyScore', 'completenessScore', 'relevanceScore', 'reasoning'],
          },
        },
      },
      required: ['questions'],
    },
  };

  try {
    const response = await this.chat(messages, 'gpt-4o-mini', 0, 4000, responseFormat);
    return response;
  } catch (error) {
    console.error('Error during QAG evaluation:', error);
    return { error: 'Failed to generate evaluation. Please check API key and request format.' };
  }
}

}
