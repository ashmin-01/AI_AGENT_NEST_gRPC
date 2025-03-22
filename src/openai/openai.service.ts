/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  private static isLogged = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!OpenAIService.isLogged) {
     /* console.log('OpenAI API Key:', apiKey ? '✔️ Key Found' : '❌ Key Missing');
      console.log(apiKey);*/
      OpenAIService.isLogged = true;
    }
  
    if (!apiKey) {
      throw new Error('Missing OpenAI API Key. Please set OPENAI_API_KEY in environment variables.');
    }
  
    this.openai = new OpenAI({ apiKey });
  }

  async evaluateResponse(
    messageHistory: string,
    agentAnswer: string,
    companyData: string,
    idealAnswer: string,
    model: string = 'gpt-3.5-turbo',
  ): Promise<string> {
    const prompt = `
You are an AI evaluator that assesses the quality of an AI agent's response based on multiple evaluation metrics.
Given the conversation history, the AI agent's response, the company's data, and the ideal human response, evaluate the response using the following criteria:

- Faithfulness (0-100): How factually accurate the response is based on company data.
- Completeness (0-100): How well the response covers key details from the ideal answer.
- Conciseness (0-100): Whether the response avoids unnecessary repetition and remains clear.
- Relevance (0-100): How well the response addresses the customer's query.
- Tone & Politeness (0-100): Whether the response maintains a professional and customer-friendly tone.

### Data:
[BEGIN DATA]
************
[Message History]: 
""" ${messageHistory} """
************
[Company Data]: 
${companyData}
************
[AI Agent Answer]: 
${agentAnswer}
************
[Ideal Answer]: 
${idealAnswer}
************
[END DATA]

### Evaluation Output Format:
{
  "faithfulness": number (0-100),
  "completeness": number (0-100),
  "conciseness": number (0-100),
  "relevance": number (0-100),
  "tone_politeness": number (0-100),
  "reasoning": string (short explanation for the scores)
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are an evaluator that provides a score for an AI response based on its accuracy, relevance, and tone, among other criteria. Output a JSON object with the evaluation score and reasoning.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 4000,
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Empty response from OpenAI API');
      }
      const result = response.choices[0].message.content;

      if (!result.trim()) {
        throw new Error('Received empty evaluation result from OpenAI API');
      }
  
      return result;
    } catch (error) {
      if (error.message.includes('Country, region, or territory not supported')) {
        console.error('Error: OpenAI API is not supported in your region.');
        return JSON.stringify({
          error: 'OpenAI API is not supported in your region. Please check OpenAI’s availability in your area.',
        });
      }
      
      if (error.message.includes('You exceeded your current quota')) {
        console.error('Error: You have exceeded your OpenAI API usage quota.');
        return JSON.stringify({
          error: 'You have exceeded your current API usage quota. Please check your plan and billing details on OpenAI’s platform.',
        });
      }
    
      console.error('Error calling OpenAI API:', error.message || error);
      return JSON.stringify({
        error: 'Failed to generate evaluation. Please check API key and request format.',
      });
    }
  }
}
