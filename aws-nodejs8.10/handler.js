const furnaceSDK = require('@project-furnace/sdk');
const handlerUtils = require('./handlerUtils');
const logic = require('./index');

if (logic.setup) logic.setup();

const processorFactory = require('./processorFactory');

let processor = null;

exports.handler = async (payload, context, callback) => {
  if (!processor) {
    processor = processorFactory.createInstance(payload);
    if (logic.receive) processor.receive = logic.receive;
  }
  try {
    const out = furnaceSDK.fp.pipe(
      handlerUtils.validatePayload,
      processor.receive,
      handlerUtils.validateEvents,
      processor.send,
    )(payload);
    callback(null, out);
  } catch (e) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('An exception ocurred', e);
    }
    callback(e);
  }
};
