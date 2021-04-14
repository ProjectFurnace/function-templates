const AWS = require("aws-sdk");
const uuid = require("uuid");

const client = new AWS.SQS({ region: process.env.REGION });
let queueUrl;

function putRecords(records) {
  return new Promise((resolve, reject) => {
    // parameters for our Kinesis stream
    const params = {
      QueueUrl: queueUrl,
      Entries: records.map((event) => ({
        Id: uuid.v4(),
        MessageBody: JSON.stringify(event),
      })),
    };

    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(
        `Sending following data to ${process.env.STREAM_NAME}`,
        params.Entries
      );
    }

    client.sendMessageBatch(params, (err) => {
      if (err) {
        // error
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log("An error ocurred when doing sendMessageBatch", err);
        }
        reject(new Error(err));
      } else {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`Pushed ${records.length} events to SQS`);
        }
        resolve(`Pushed ${records.length} events to SQS`);
      }
    });
  });
}

async function send(events) {
  if (!queueUrl) {
    queueUrl = (
      await client.getQueueUrl({ QueueName: process.env.STREAM_NAME }).promise()
    ).QueueUrl;
  }

  if (events.length > 10) {
    const promises = [];
    const slices = Math.ceil(events.length / 10);

    for (let ii = 0; ii < slices; ii += 1) {
      const chunk = events.slice(ii * 10, (ii + 1) * 10);

      promises.push(putRecords(chunk));
    }
    return Promise.all(promises);
  }
  return putRecords(events);
}

module.exports.send = send;
