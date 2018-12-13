const logic = require('.');

function putRecords(client, records) {
  return new Promise((resolve, reject) => {
    // parameters for our Kinesis stream
    const params = {
      StreamName: process.env.STREAM_NAME,
      Records: records.map(event => ({
        Data: JSON.stringify(event),
        PartitionKey: process.env.PARTITION_KEY,
      })),
    };

    client.putRecords(params, (err) => {
      if (err) {
        // error
        reject(new Error(err));
      } else {
        resolve(`Pushed ${records.length} events to Kinesis`);
      }
    });
  });
}

function send(client, events) {
  if (events.length > 500) {
    const promises = [];
    const slices = Math.ceil(events.length / 500);

    for (let ii = 0; ii < slices; ii += 1) {
      const chunk = events.slice(ii * 500, (ii + 1) * 500);

      promises.push(putRecords(client, chunk));
    }
    return Promise.all(promises);
  }
  return putRecords(client, events);
}

async function unpackAndProcess(events) {
  const outputEvents = [];
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii].kinesis && events[ii].kinesis.data) {
      const event = JSON.parse(Buffer.from(events[ii].kinesis.data, 'base64'));
      outputEvents.push(await logic.handler(event));
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No "kinesis" or "data" properties in events received');
    }
  }
  return outputEvents;
}

module.exports.send = send;
module.exports.unpackAndProcess = unpackAndProcess;
