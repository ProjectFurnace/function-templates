const kinesisReceiver = require('./processors/kinesis/receive').receive;
const kinesisSender = require('./processors/kinesis/send').send;
const sqsReceiver = require('./processors/sqs/receive').receive;
const sqsSender = require('./processors/sqs/send').send;
const s3Receiver = require('./processors/s3/receive').receive;
const cloudwatchReceiver = require('./processors/cloudwatch/receive').receive;
const apigatewayReceiver = require('./processors/apigateway/receive').receive;
const genericCallback = require('./processors/lib/callback');
const apigwCallback = require('./processors/apigateway/callback');

module.exports.createInstance = (payload, output) => {
  if (!payload.Records && (!payload.requestContext && !payload.headers)) throw new Error('unable to detect payload type');
  if (payload.Records && payload.Records.length < 1) throw new Error('no records in payload');

  const firstRecord = payload.Records ? payload.Records[0] : {};

  let outputType;
  if (output) {
    outputType = output.toLowerCase();
  }

  if (firstRecord.eventSource) {
    // switch output based on either input or the outputType env var
    switch (firstRecord.eventSource) {
      case 'aws:kinesis':
        return [kinesisReceiver, (outputType === 'aws.sqs.queue' ? sqsSender : kinesisSender), genericCallback];
      case 'aws:sqs':
        return [sqsReceiver, (outputType === 'aws.kinesis.stream' ? kinesisSender : sqsSender), genericCallback];
      case 'aws:s3':
        return [s3Receiver, (outputType === 'aws.sqs.queue' ? sqsSender : kinesisSender), genericCallback];
      default:
        throw new Error(`unable to get processor for eventSource ${firstRecord.eventSource}`);
    }
  // cloudwatch scheduled events have a completely different event format...
  } else if (payload.source === 'aws.events') {
    return [cloudwatchReceiver, (outputType === 'aws.sqs.queue' ? sqsSender : kinesisSender), genericCallback];
  // api gateway is yet another different scenario...
  } else if (payload.requestContext && payload.headers) {
    return [apigatewayReceiver, (outputType === 'aws.sqs.queue' ? sqsSender : kinesisSender), apigwCallback];
  } else {
    throw new Error('eventSource not available in payload records or payload source not supported');
  }
};
