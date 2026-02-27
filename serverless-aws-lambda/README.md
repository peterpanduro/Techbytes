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

### 1. AWS
Make sure you have an account. Serverless will take care of the rest.

### 2. Serverless
Serverless documentation: https://www.serverless.com/framework/docs/tutorial
1. Install serverless framework
```
npm install -g serverless
```
2. Login
```
serverless login
serverless login aws
```
3. Create serverless project
```
serverless
```
4. Follow the prompts (AWS - Node.js - HTTP API)

5. Navigate to the project directory
```
cd <NAME_OF_PROJECT>
```
6. Install dependencies
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
8. Deploy
```
serverless deploy
```
9. Check the provided URL to see the result of your first deployed lambda function
## Coding time!
TBD
### Test the API
```
# serverless invoke -f <FUNCTION_NAME> --path <PATH_TO_FILE>
serverless invoke -f weather --path ./weather/weather.json
```
### Deploy single function (quicker)
```
# serverless deploy function -f <FUNCTION_NAME>
serverless deploy function -f weather
```
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

Q: Why Serverless?
A: It's the easiest and quickest way to deploy a lambda function.

## Suggested Next Steps
- Connect Serverless to AWS
    - You are guided through this process if you navigate to Serverless Dashboard
- Connect to database
    - DynamoDB inside AWS (also has a generous free tier)
    - AtlasDB (MongoDB with 512MB free storage)
    - Any custom database
- POST, PUT, PATCH, DELETE
- Authentication / Authorization / Security
- Separate staging and production environments
- Automate deployments using CI/CD
- Custom domain
- Other programming languages
