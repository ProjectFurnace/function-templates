const furnaceSDK = require("@project-furnace/sdk");
const fs = require("fs");
const handlerUtils = require("./handlerUtils");

let logic;

const processorFactory = require("./processorFactory");

let receiver = null;
let sender = null;

let setupComplete = false;

exports.handler = async (payload, context) => {
  if (process.env.DEBUG) console.log("received payload", payload);

  if (!setupComplete) setup();

  if (!receiver) {
    [receiver, sender] = processorFactory.createInstance(
      payload,
      process.env.OUTPUT_TYPE
    );
    if (!process.env.COMBINE && logic.receive) {
      receiver = logic.receive;
    }
  }
  try {
    const [logicResponse] = await furnaceSDK.fp.pipe(
      handlerUtils.validatePayload,
      receiver
    )([payload, context]);

    let senderResponse = "No response or events to output";

    if (logicResponse.events && logicResponse.events.length > 0) {
      senderResponse = await furnaceSDK.fp.pipe(
        handlerUtils.validateEvents,
        sender
      )(logicResponse.events);
    }

    const responseMessage = logicResponse.response
      ? logicResponse.response
      : senderResponse;

    if (process.env.DEBUG) console.log("sending response", responseMessage);

    return responseMessage;
  } catch (e) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log("An exception ocurred", e);
    }
    throw e;
  }
};

function setup() {
  // if this is not a combined function, require the index of the function
  // and check if there is a setup method
  if (process.env.DEBUG) console.log("running function setup");

  if (!process.env.COMBINE) {
    let logicPath = process.env.LOGIC_PATH || "./index";

    // eslint-disable-next-line global-require
    logic = require(logicPath);

    if (logic.setup) logic.setup();
  }
}
