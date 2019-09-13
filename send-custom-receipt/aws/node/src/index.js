const AWS = require("aws-sdk"),
  SES = new AWS.SES(),
  UTF8CHARSET = "UTF-8";
const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Format a decimal number to USD
const formatUSD = (
  amount,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
) => {
  const amountInDollars = parseInt(amount, 10) / 100;
  return amountInDollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits
  });
};

const MERCHANT_NAME = (process.env.MERCHANT_NAME = "Pasha");
const MERCHANT_EMAIL = process.env.FROM_EMAIL;
const MERCHANT_BRAND_COLOR = process.env.BRAND_COLOR;
const MERCHANT_LOGO = process.env.BRAND_LOGO;

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

    const emailParams = formatEmail(event.data.object);

    // Send the email with SES
    return SES.sendEmail(emailParams)
      .promise()
      .then(() => {
        return {
          statusCode: 200
        };
      })
      .catch(err => {
        // An error happened while sending the email
        console.error(err, err.stack);
        return { statusCode: 500 };
      });
  } catch (err) {
    console.error("Error occured while formatting email: ", err);
    return {
      statusCode: 500
    };
  }
};

const lineItemHtml = (itemTitle, itemAmount) => {
  const lineItemTemplate = fs.readFileSync(
    path.join(__dirname + "/line_item.html"),
    "utf8"
  );

  return lineItemTemplate
    .replace("{{line_item_title}}", itemTitle)
    .replace("{{line_item_amount}}", itemAmount);
};

const formatEmail = data => {
  // Load email template
  const htmlTemplate = fs.readFileSync(
    path.join(__dirname + "/email_template.html"),
    "utf8"
  );

  let lineItemsHtmlString = "";
  const metadata = data.metadata || {};

  if (Object.keys(metadata).length > 0) {
    // Metadata consists of key-value pairs that can be set on Stripe resources
    // Here is an example of using metadata to track line items on an order e.g:
    // metadata: {
    //   "productName1": "599",
    //   "productName2": "749"
    // }
    lineItemsHtmlString = Object.keys(data.metadata).reduce(
      (htmlString, productName) => {
        return (
          htmlString + lineItemHtml(productName, data.metadata[productName])
        );
      },
      ""
    );
  }

  // Replace with information about the order from the PaymentIntent
  const html = htmlTemplate
    .replace(/{{total_amount}}/g, `$${formatUSD(data.amount)}`)
    .replace(/{{brand_color}}/g, MERCHANT_BRAND_COLOR)
    .replace("{{date_paid}}", new Date(data.created * 1000).toDateString())
    .replace("{{merchant_email}}", MERCHANT_EMAIL)
    .replace("{{merchant_name}}", MERCHANT_NAME)
    .replace("{{line_items}}", lineItemsHtmlString)
    .replace("{{merchant_logo}}", MERCHANT_LOGO);

  const TO_EMAIL = data["receipt_email"] || MERCHANT_EMAIL;

  // Format params for SES
  // Learn more about the SES Node.js SDK at
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ses-examples-sending-email.html
  const emailParams = {
    Destination: {
      ToAddresses: [TO_EMAIL]
    },
    Message: {
      Body: { Html: { Charset: UTF8CHARSET, Data: html } },
      Subject: {
        Charset: UTF8CHARSET,
        Data: "Your receipt"
      }
    },
    Source: MERCHANT_EMAIL
  };

  return emailParams;
};
