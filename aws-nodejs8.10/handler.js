const AWS = require('aws-sdk');
const ks = require('./kinesis');
const logic = require('.');

const client = new AWS.Kinesis({ region: process.env.REGION });

if (logic.setup) logic.setup();
if (logic.unpackAndProcess) ks.unpackAndProcess = logic.unpackAndProcess;

exports.handler = function handler(ksEvents, context, callback) {
  try {
    if (ksEvents && ksEvents.Records) {
      const outputEvents = ks.unpackAndProcess(ksEvents.Records);

      if (outputEvents.length > 0) {
        ks.send(client, outputEvents);
      }
    }
  } catch (e) {
    callback(e);
  }
};
