const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2"
});

const docClient = new AWS.DynamoDB.DocumentClient();

const updateItem = function(params) {
  docClient.update(params, function(err, data) {
    if (err) {
      console.log(`Unable to update item ${record.Keys.id.S}`, err);
    } else {
      console.log("Update succeeded:", data);
    }
  });
};

const createUpdateParams = function(id, status) {
  return {
    TableName: process.env.TABLE_NAME,
    Key: {
      id: id
    },
    UpdateExpression: "set info.status = :s",
    ExpressionAttributeValues: {
      ":s": status
    }
  };
};

exports.handler = async event => {
  try {
    // Do some long running process here
    console.log("Got event!", event);
    event.Records.forEach(function(record) {
      console.log("Record: ", record.dynamodb);

      const webhookEvent = record.dynamodb.NewImage.data.M;

      console.log("Data: ", eventData);
      // Only process pending events in Stripe testmode
      console.log('is livemode', !webhookEvent.livemode.BOOL)
      console.log('statis', record.dynamodb.NewImage.status.S)
      if (record.dynamodb.NewImage.status.S === "pending" && !webhookEvent.livemode.BOOL) {
        // run whatever process you need

        const params = createUpdateParams(record.Keys.id.S, "processed");
        updateItem(params);
      }
    });
  } catch (err) {
    console.log("Error while processing event, ", err);
  }
};
