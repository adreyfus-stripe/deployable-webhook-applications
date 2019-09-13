
# Sending a Custom E-mail Receipt with AWS Lambda

## Description

This Lambda is a webhook handler that listens for a payment_intent.succeeded event and creates a custom e-mail receipt with the relevant params.

## Deployment Parameters

This component has two CloudFormation deployment parameters:

- `FromEmail`, a required parameter, represents the email sender. Must be a SES verified email. If you attempt to send email using a non-verified address or domain, the operation results in an "Email address not verified" error.
- `StripeSecretKey`, your Stripe secret key.

## Latest Release - 0.0.0

Initial release.

## How to deploy 

This assumes you already have an AWS and Stripe account. 

1. Download the AWS CLI: 

```
pip3 install awscli
```

2. Verify the e-mail you want to send the receipts from: 

```
aws ses verify-email-identity --email-adress you-email@your-domain.com
```

3. Create a role with the right Lambda access 

```
tbd
```

4. Create the function: 

```
aws lambda create-function --function-name YOUR-FUNCTION-NAME --zip-file fileb://function.zip --handler index.handler --runtime nodejs10.x --role YOUR-ROLE
```

5. Add the CloudFormation deployment parameters in the dashboard UI