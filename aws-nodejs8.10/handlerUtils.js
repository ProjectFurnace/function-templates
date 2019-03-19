const AWS = require('aws-sdk');
const awsParamStore = require('aws-param-store');

function validatePayload(payload) {
  if (payload && payload.Records) {
    return payload.Records;
  }
  throw new Error('No property "Records" in received event');
}

function validateEvents(events) {
  if (process.env.STREAM_NAME && events.length > 0) {
    return events;
  }
  throw new Error('No output stream defined or no events to output');
}

// process any input parameters we may have and dump them into ENV vars
const inputParameters = awsParamStore.getParametersByPathSync(`/${process.env.FURNACE_INSTANCE}/${process.env.AWS_LAMBDA_FUNCTION_NAME}/`);
if (inputParameters) {
  inputParameters.forEach((param) => {
    const envVarName = 'INPUT_'.concat(param.Name.substr(param.Name.lastIndexOf('/') + 1).replace(/\./g, '_').toUpperCase());
    process.env[envVarName] = param.Value;
  });
}

module.exports.validatePayload = validatePayload;
module.exports.validateEvents = validateEvents;
