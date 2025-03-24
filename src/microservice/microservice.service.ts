import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class MicroserviceService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ Warning: API Key is missing. Check if your .env file is loaded correctly.');
    }
    
    this.openai = new OpenAI({ apiKey });
  }

  async evaluateResponseRubric(
    messageHistory: { role: string; content: string }[],
    companyData: Record<string, string>,
    agentAnswer: string,
  ): Promise<object> {
    const prompt = `
You are an assistant that evaluates how well the customer service agent answers a user question by considering the provided company data and multiple evaluation metrics.

You will be given the conversation history, the company data (information the AI agent is allowed to use), and the AI agent's response.
Compare the factual content of the submitted answer with the provided company data.
Ignore differences in style, grammar, or punctuation.

Assign a score from 0 to 100 for each of the following metrics, and explain your reasoning for each score:
- Faithfulness: How factually accurate the response is based on company data.
- Completeness: How well the response covers key details from the ideal answer.
- Conciseness: Whether the response avoids unnecessary repetition and remains clear.
- Relevance: How well the response addresses the customer's query.
- Tone & Politeness: Whether the response maintains a professional and customer-friendly tone.

### Data:
[BEGIN DATA]
************
[Message History]: 
""" ${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')} """
************
[Company Data]: 
${JSON.stringify(companyData, null, 2)}
************
[AI Agent Answer]: 
${agentAnswer}
************
[END DATA]

### Evaluation Output Format:
{
  "metrics": [
    { "metric": "Faithfulness", "score": number, "reason": string },
    { "metric": "Completeness", "score": number, "reason": string },
    { "metric": "Conciseness", "score": number, "reason": string },
    { "metric": "Relevance", "score": number, "reason": string },
    { "metric": "Tone & Politeness", "score": number, "reason": string }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // You can change this to 'gpt-4' or other available models
        messages: [
          {
            role: 'system',
            content:
              'You are an evaluator that provides a score for an AI response based on multiple metrics such as accuracy, completeness, and relevance.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 4000,
      });
      console.log("repsonse : ", response)
      if (!response.choices || !response.choices[0]?.message?.content) {
        throw new Error('Empty response from OpenAI API');
      }

      const result = JSON.parse(response.choices[0].message.content);
      return result.metrics.map((metric: any) => ({
        metric: metric.metric,
        score: metric.score,
        reason: metric.reason,
      }));
    } catch (error) {
      console.error('Error during evaluation:', error);
      return { error: 'Failed to generate evaluation. Please check API key and request format.' };
    }
  }

  async evaluateResponseIdeal(
    messageHistory: { role: string; content: string }[],
    agentAnswer: string,
    idealAnswer: string,
  ): Promise<object> {
    const prompt = `
You are an assistant that evaluates how well the customer service agent's answer compares to the ideal (expert) answer.
You will be given the conversation history, the ideal answer, and the AI agent's response.

Compare the factual content of the submitted answer with the ideal answer.
Ignore differences in style, grammar, or punctuation.

Evaluate the response based on the following cases. For each case, assign a score from 0 to 100 and explain your reasoning:
- The submitted answer is a subset of the ideal answer and is fully consistent with it.
- The submitted answer is a superset of the ideal answer and is fully consistent with it.
- The submitted answer contains all the same details as the ideal answer.
- There is a disagreement between the submitted answer and the ideal answer.
- The answers differ, but these differences don't matter from the perspective of factuality.

### Data:
[BEGIN DATA]
************
[Message History]: 
""" ${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')} """
************
[Ideal Answer]: 
${idealAnswer}
************
[AI Agent Answer]: 
${agentAnswer}
************
[END DATA]

### Evaluation Output Format:
{
  "cases": [
    { "case": "Fully consistent with ideal answer", "score": number, "reason": string },
    { "case": "Contains same details with minor differences", "score": number, "reason": string },
    { "case": "Disagreement with ideal answer", "score": number, "reason": string },
    { "case": "Differences not significant", "score": number, "reason": string }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // You can change this to 'gpt-4' or other available models
        messages: [
          {
            role: 'system',
            content:
              'You are an evaluator that compares an AI agent’s response to an ideal response based on accuracy and consistency.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 4000,
      });

      if (!response.choices || !response.choices[0]?.message?.content) {
        throw new Error('Empty response from OpenAI API');
      }

      const result = JSON.parse(response.choices[0].message.content);
      return result.cases.map((evaluationCase: any) => ({
        case: evaluationCase.case,
        score: evaluationCase.score,
        reason: evaluationCase.reason,
      }));
    } catch (error) {
      console.error('Error during evaluation:', error);
      return { error: 'Failed to generate evaluation. Please check API key and request format.' };
    }
  }
}
