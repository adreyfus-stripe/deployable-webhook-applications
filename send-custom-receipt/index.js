const AWS = require("aws-sdk"),
  SES = new AWS.SES(),
  processResponse = require("./process-response.js"),
  FROM_EMAIL = process.env.FROM_EMAIL,
  UTF8CHARSET = "UTF-8";

const fs = require("fs");
const path = require("path");

// Format a decimal number to USD
// Same method we use on the frontend to format
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

exports.handler = event => {
  if (event.httpMethod === "OPTIONS") {
    return Promise.resolve(processResponse(true));
  }

  const data = event.data.object;

  // Load the e-mail template
  let html = fs.readFileSync(
    path.join(__dirname + "/email_template.html"),
    "utf8"
  );

  // Replace appropriate fields
  html = html
    .replace("{{total_amount}}", `$${formatUSD(data.object.amount)}`)
    .replace("{{total_amount_header}}", `$${formatUSD(data.object.amount)}`)
    .replace("{{date_paid}}", new Date(order.created * 1000).toDateString());
  
  const emailData = {
    toEmails: [data["receipt_email"]],
    subject: "Your receipt",
    message: html
  };

  if (
    !emailData.toEmails ||
    !Array.isArray(emailData.toEmails) ||
    !emailData.subject ||
    !emailData.message
  ) {
    return Promise.resolve(
      processResponse(
        true,
        "Please specify email parameters: toEmails, subject and message",
        400
      )
    );
  }

  const destination = {
    ToAddresses: emailData.toEmails
  };

  const body = { Html: { Charset: UTF8CHARSET, Data: emailData.message } };

  const emailParams = {
    Destination: destination,
    Message: {
      Body: body,
      Subject: {
        Charset: UTF8CHARSET,
        Data: emailData.subject
      }
    },
    Source: FROM_EMAIL
  };

  if (emailData.replyToEmails && Array.isArray(emailData.replyToEmails)) {
    emailParams.ReplyToAddresses = emailData.replyToEmails;
  }

  return SES.sendEmail(emailParams)
    .promise()
    .then(() => processResponse(true))
    .catch(err => {
      console.error(err, err.stack);
      const errorResponse = `Error: Execution update, caused a SES error, please look at your logs.`;
      return processResponse(true, errorResponse, 500);
    });
};
