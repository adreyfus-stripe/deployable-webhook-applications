const AWS = require("aws-sdk");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

AWS.config.update({
  region: "us-west-2"
});

const docClient = new AWS.DynamoDB.DocumentClient();

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

    const paymentData = event.data;

    var params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: `Order_${paymentData.id}`,
        amount: paymentData.amount
      }
    };

    return new Promise((resolve, reject) => {
      // Write order information to DynamoDB
      docClient.put(params, function(err, data) {
        if (err) {
          console.error(
            "Unable to add item. Error JSON:",
            JSON.stringify(err, null, 2)
          );
          reject(err);
        } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
        }
        resolve({
          statusCode: 200
        });
      });
    });
  } catch (err) {
    console.error("Error occured while verifying webhook signature: ", err);
    return {
      statusCode: 500
    };
  }
};
