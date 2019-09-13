# Serverless webhook handlers

Serverless functions are a great way to quickly spin up a simple webhook handler to respond to events from Stripe.

We created some pre-built serverless application to get some common Stripe workflows up and running on AWS. 

| Name  | Description  | Platforms  | Languages  |  
|---|---|---|---|
| [process-events-offline](/process-events-offline)  | Stores the raw webhook event to use for later offline processing  |  AWS  |  Node  |
| [send-custom-receipt](/send-custom-receipt)  | Sends a custom email receipt when a PaymentIntent succeeds  |  AWS  |  Node  |
| [update-database](/update-database)  | Updates a database with information about a successful payment  |  AWS  |  Node  |
| [save-card-to-customer](/save-card-to-customer)  | Saves a card to a new Customer object on Stripe for later reuse  |  AWS  |  Node  |

## Deploying with AWS

Steps on deploying with AWS
