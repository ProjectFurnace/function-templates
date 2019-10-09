const AWS = require('aws-sdk');

const client = new AWS.Kinesis({ region: process.env.REGION });

function putRecords(records) {
  return new Promise((resolve, reject) => {
    // parameters for our Kinesis stream
    const params = {
      StreamName: process.env.STREAM_NAME,
      Records: records.map(event => ({
        Data: JSON.stringify(event),
        PartitionKey: process.env.PARTITION_KEY,
      })),
    };

    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`Sending following data to ${process.env.STREAM_NAME}`, params.Records);
    }

    client.putRecords(params, (err) => {
      if (err) {
        // error
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log('An error ocurred when doing putRecords', err);
        }
        reject(new Error(err));
      } else {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`Pushed ${records.length} events to Kinesis`);
        }
        resolve(`Pushed ${records.length} events to Kinesis`);
      }
    });
  });
}

function send(events) {
  if (events.length > 500) {
    const promises = [];
    const slices = Math.ceil(events.length / 500);

    for (let ii = 0; ii < slices; ii += 1) {
      const chunk = events.slice(ii * 500, (ii + 1) * 500);

      promises.push(putRecords(chunk));
    }
    return Promise.all(promises);
  }
<<<<<<< HEAD:aws-nodejs8.10/processors/kinesis/send.js
  return putRecords(events);
=======
  return putRecords(client, events);
}

async function unpackAndProcess(events) {
  const outputEvents = [];
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii].kinesis && events[ii].kinesis.data) {
      const event = JSON.parse(Buffer.from(events[ii].kinesis.data, 'base64'));
      // we are using a for loop that allows for async
      // eslint-disable-next-line no-await-in-loop
      const processedEvent = await logic.handler(event);
      if (processedEvent != null) outputEvents.push(processedEvent);
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No "kinesis" or "data" properties in events received');
    }
  }
  return outputEvents;
>>>>>>> master:aws-nodejs8.10/kinesis.js
}

module.exports.send = send;
