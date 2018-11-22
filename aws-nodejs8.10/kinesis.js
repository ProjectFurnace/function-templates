const logic = require('.');

async function send(client, events) {
  return new Promise((resolve, reject) => {
    // parameters for our Kinesis stream
    const params = {
      StreamName: process.env.STREAM_NAME,
      Records: events.map(event => ({
        Data: Buffer.from(JSON.stringify(event)).toString('base64'),
        PartitionKey: process.env.PARTITION_KEY,
      })),
    };

    client.putRecords(params, (err) => {
      if (err) {
        // error
        reject(new Error(err));
      } else {
        resolve(`Pushed ${events.length} events to Kinesis`);
      }
    });
  });
}

function unpackAndProcess(events) {
  const outputEvents = [];
  events.forEach((elem) => {
    if (elem.kinesis && elem.kinesis.data) {
      const event = JSON.parse(Buffer.from(elem.kinesis.data, 'base64'));
      outputEvents.push(logic.handler(event));
    }
  });
  return outputEvents;
}

module.exports.sendEvents = send;
module.exports.unpackAndProcess = unpackAndProcess;
