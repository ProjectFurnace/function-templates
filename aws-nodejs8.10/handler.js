const AWS = require('aws-sdk');
const ks = require('./kinesis');
const logic = require('.');

const client = new AWS.Kinesis({ region: process.env.REGION });

if (logic.unpackAndProcess) ks.unpackAndProcess = logic.unpackAndProcess;

exports.handler = async function handler(ksEvents, context, callback) {
  try {
    if (ksEvents && ksEvents.Records) {
      const outputEvents = ks.unpackAndProcess(ksEvents.Records);

      if (outputEvents.length > 0) {
        const out = await ks.send(client, outputEvents);
        callback(null, out);
      }
    }
  } catch (e) {
    callback(e);
  }
};
