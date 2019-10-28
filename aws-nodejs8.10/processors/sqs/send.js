const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const client = new AWS.SQS({ region: process.env.REGION });
let queueUrl;

function putRecords(records) {
  return new Promise((resolve, reject) => {
    // parameters for our Kinesis stream
    const params = {
      QueueUrl: queueUrl,
      Entries: records.map(event => ({
        Id: uuidv4(),
        MessageBody: JSON.stringify(event),
      })),
    };

    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`Sending following data to ${process.env.STREAM_NAME}`, params.Entries);
    }

    client.sendMessageBatch(params, (err) => {
      if (err) {
        // error
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log('An error ocurred when doing sendMessageBatch', err);
        }
        reject(new Error(err));
      } else {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`Pushed ${records.length} events to SQS`);
        }
        resolve({ msg: `Pushed ${records.length} events to SQS`, events: records });
      }
    });
  });
}

async function send(events) {
  if (!queueUrl) {
    queueUrl = (await client.getQueueUrl({ QueueName: process.env.STREAM_NAME }).promise()).QueueUrl;
  }

  if (events.length > 100) {
    const promises = [];
    const slices = Math.ceil(events.length / 100);

    for (let ii = 0; ii < slices; ii += 1) {
      const chunk = events.slice(ii * 100, (ii + 1) * 100);

      promises.push(putRecords(chunk));
    }
    return Promise.all(promises);
  }
  return putRecords(events);
}

module.exports.send = send;
