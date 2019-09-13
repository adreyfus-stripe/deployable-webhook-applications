const AWS = require("aws-sdk"),
  SES = new AWS.SES(),
  UTF8CHARSET = "UTF-8";
const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async event => {
  const eventBody = JSON.parse(event.body);

  if (eventBody.type !== "payment_intent.succeeded") {
    // Ignore events that are not payment_intent.succeeded
    return {
      statusCode: 200
    };
  }

  try {
    let signature = event.headers["Stripe-Signature"];

    // Verifies that the webhook event was sent by Stripe
    // For more on checking webhook signatures read
    // https://stripe.com/docs/webhooks/signatures
    event = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const paymentIntent = event.data.object;

    if (paymentIntent.payment_method && paymentIntent.setup_future_usage) {
      // Only create a new Customer if the PaymentIntent has been properly
      // set up with setup_future_usage and has a valid PaymentMethod attached
      const customer = await stripe.customers.create({
        description: `Customer for payment ${paymentIntent.id}`,
        payment_method: paymentIntent.payment_method
      });

      console.log("Customer created: ", customer.id);
    }

    return {
      statusCode: 200
    };
  } catch (err) {
    console.error("Error occured while creating a customer: ", err);
    return {
      statusCode: 500
    };
  }
};
