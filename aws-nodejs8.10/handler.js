const furnaceSDK = require('@project-furnace/sdk');
const fs = require('fs');
const handlerUtils = require('./handlerUtils');

let logic;

// if this is not a combined function, require the index of the function
// and check if there is a setup method
if (!process.env.COMBINE) {
  let logicPath = './index';
  if (fs.existsSync('./aws/')) {
    logicPath = './aws/index';
  }

  // eslint-disable-next-line global-require
  logic = require(logicPath);

  if (logic.setup) logic.setup();
}

const processorFactory = require('./processorFactory');

let receiver = null;
let sender = null;

exports.handler = async (payload, context, callback) => {
  if (!receiver) {
    [receiver, sender] = processorFactory.createInstance(payload, process.env.OUTPUT_TYPE);
    if (!process.env.COMBINE && logic.receive) {
      receiver = logic.receive;
    }
  }
  try {
    const out = await furnaceSDK.fp.pipe(
      handlerUtils.validatePayload,
      receiver,
      handlerUtils.validateEvents,
      sender,
    )(payload);
    //if we have a meta response on the first event, use that as the callback output (useful for API GW for example)
    if (out.events && Array.isArray(out.events) && out.events[0].meta && out.events[0].meta.response) {
      if (process.env.DEBUG) {
        console.log('meta.response present with value: ', out.events[0].meta.response);
      }
      callback(null, out.events[0].meta.response);
    } else {
      callback(null, out.msg);
    }
  } catch (e) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('An exception ocurred', e);
    }
    callback(e);
  }
};
