# Saving payment method to Customer

## Description

This Lambda is a webhook handler that listens for a payment_intent.succeeded event and creates a new Stripe Customer to save the PaymentMethod data to.

## Deployment Parameters

There are two environment variables required:

- `STRIPE_WEBHOOK_SECRET`, a required parameter, the webhook endpoint secret from your Stripe webhook.
- `STRIPE_SECRET_KEY`, a required parameter, your Stripe merchant secret API key.


## Latest Release - 0.0.0

Initial release.

## How to deploy locally

This assumes you already have an AWS and Stripe account.

1. Download the AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html

**On Mac OS**
Using Homebrew

```
brew tap aws/tap
brew install aws-sam-cli
```

2. Create a S3 bucket

```
aws s3 mb s3://stripe-create-customer
```

3. Package the application

```
sam package --template-file template.yaml --s3-bucket stripe-create-customer --output-template-file output.yaml
```

4. Deploy the application

```
sam deploy --template-file ./output.yaml --stack-name stripe-create-customer --capabilities CAPABILITY_IAM
```
