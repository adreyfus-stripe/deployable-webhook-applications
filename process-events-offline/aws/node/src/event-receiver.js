const AWS = require("aws-sdk");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

AWS.config.update({
  region: "us-west-2"
});

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async event => {
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

    var params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: `evt-${new Date().toISOString()}`,
        data: event,
        status: "pending", // pending | processing | failed | processed
        source: "stripe", // useful if you want to process events from other sources
        created: new Date().toISOString(),
        processed: new Date().toISOString()
      }
    };

    return new Promise((resolve, reject) => {
      // Write event to DynamoDB and immediately return 200 to Stripe
      docClient.put(params, function(err, data) {
        if (err) {
          console.error(
            "Unable to add item. Error JSON:",
            JSON.stringify(err, null, 2)
          );
          reject(err);
        } else {
          // DynamoDb will send an event to EventProcessor function once the item is added
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
