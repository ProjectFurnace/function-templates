const AWS = require('aws-sdk');
const awsParamStore = require('aws-param-store');
const ks = require('./kinesis');
const logic = require('.');

if (logic.setup) logic.setup();

const client = new AWS.Kinesis({ region: process.env.REGION });

if (logic.unpackAndProcess) ks.unpackAndProcess = logic.unpackAndProcess;

// process any input parameters we may have and dump them into ENV vars
const inputParameters = awsParamStore.getParametersByPathSync(`/${process.env.STACK_NAME}/${process.env.STACK_ENV}/${process.env.AWS_LAMBDA_FUNCTION_NAME}`);
if (inputParameters) {
  inputParameters.forEach((param) => {
    const envVarName = 'INPUT_'.concat(param.Name.substr(param.Name.lastIndexOf('/') + 1).replace(/\./g, '_').toUpperCase());
    process.env[envVarName] = param.Value;
  });
}


exports.handler = async function handler(ksEvents, context, callback) {
  try {
    if (ksEvents && ksEvents.Records) {
      const outputEvents = await ks.unpackAndProcess(ksEvents.Records);

      if (process.env.STREAM_NAME && outputEvents.length > 0) {
        const out = await ks.send(client, outputEvents);
        callback(null, out);
      } else if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.log('No output stream defined or no events to output');
      }
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No property "Records" in Kinesis received data');
    }
  } catch (e) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('An exception ocurred', e);
    }
    callback(e);
  }
};
