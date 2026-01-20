# AWS Lambda

## Overview
Main goal: Deploy a custom lambda function to AWS using the Serverless
Framework.

Additional objectives:
- Consume a REST API
- Modify the API response
- Expose the result as your own API

## Prerequisites
- AWS Account
- Node.js
    - https://nodejs.org/en/download/
- Serverless Account
    - https://www.serverless.com/framework

## Steps

### AWS
Make sure you have an account. Serverless will take care of the rest.

### Serverless
Serverless documentation: https://www.serverless.com/framework/docs/tutorial
1. Install serverless framework
```
npm install -g serverless
```
2. Create serverless project
```
serverless
```
3. Follow the prompts (AWS - Node.js - HTTP API)

4. Navigate to the project directory
```
cd <NAME_OF_PROJECT>
```
5. Install dependencies
```
npm init
npm install
```
7. Set region to Stockholm (eu-north-1)
Open `serverless.yml` and change the `provider` section to:
```
provider:
  name: aws
  runtime: nodejs20.x
  region: eu-north-1
```
6. Deploy
```
serverless deploy
```

## Coding time!

## Remove the Lambda
```
serverless remove
```

## FAQ
Q: Does AWS lambda cost anything?
A: The AWS Lambda free tier includes one million free requests per month and
400,000 GB-seconds of compute time per month.
https://aws.amazon.com/lambda/pricing/
Even a lambda running once every minute for nine seconds using 1GB of memory is
100% free.
https://calculator.aws/#/createCalculator/Lambda

Q: Does Serverless cost anything?
A: Only for organizations earning over $2 million annually.
https://www.serverless.com/pricing

## Suggested Next Steps
- Connect Serverless to AWS
    - You are guided through this process if you navigate to Serverless Dashboard
- Authentication / Authorization
- Separate staging and production environments
- Custom domain
