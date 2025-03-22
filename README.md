# AI Response Evaluation Service

## Overview
This project is a **NestJS-based AI response evaluation service** that interacts with OpenAI's API to assess the quality of AI-generated responses. It evaluates AI-generated messages based on multiple criteria, such as faithfulness, completeness, conciseness, relevance, and tone.

The service takes in conversation history, AI responses, company-specific data, and an ideal response to generate a structured evaluation report.

## Features
- Uses **OpenAI's GPT models** (default: `gpt-3.5-turbo`) for evaluation.
- Assesses AI responses based on:
  - **Faithfulness** (accuracy based on company data)
  - **Completeness** (coverage of key details)
  - **Conciseness** (clarity and brevity)
  - **Relevance** (response alignment with the query)
  - **Tone & Politeness** (maintains professional and friendly tone)
- Provides structured JSON output with scores and reasoning.
- Built with **NestJS** for a modular and scalable backend architecture.
- Supports **gRPC** for efficient communication.

## Prerequisites
Ensure you have the following installed:
- **Node.js** (v16+ recommended)
- **npm** (v8+ recommended)
- **NestJS CLI** (optional but recommended):
  ```bash
  npm install -g @nestjs/cli
  ```
- **OpenAI API Key** (stored in `OPENAI_API_KEY` environment variable)

## Installation
Clone the repository and install dependencies:
```bash
$ git clone <repository_url>
$ cd <project_directory>
$ npm install
```

## Environment Configuration
Create a `.env` file in the root directory and add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key
```

## Running the Service
### Development Mode
```bash
$ npm run start
```
### Watch Mode (Hot Reloading)
```bash
$ npm run start:dev
```
### Production Mode
```bash
$ npm run start:prod
```

## Testing
### Unit Tests
```bash
$ npm run test
```
### End-to-End (e2e) Tests
```bash
$ npm run test:e2e
```
### Test Coverage
```bash
$ npm run test:cov
```

## Using gRPC with Postman
To test the gRPC service using **Postman**, follow these steps:

1. Open **Postman** and switch to the **gRPC** tab.
2. Enter the **gRPC server URL** (e.g., `localhost:50051`).
3. Select the method `EvaluateResponse`.
4. In the **body**, provide a request similar to:
    ```json
    {
      "messageHistory": "Customer: What are your refund policies? AI: We offer a 30-day return policy.",
      "agentAnswer": "We have a flexible return policy that allows returns within 30 days.",
      "companyData": "Our policy states that returns are accepted within 30 days with a receipt.",
      "idealAnswer": "Our refund policy allows customers to return items within 30 days with proof of purchase.",
      "model": "gpt-3.5-turbo"
    }
    ```
5. Send the request and view the structured evaluation response.

## Deployment
Refer to the [NestJS deployment guide](https://docs.nestjs.com/deployment) for best practices.

## License
This project is **MIT licensed**.