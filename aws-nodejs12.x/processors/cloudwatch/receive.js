const processorInitialise = require("../lib/initialise");

async function receive([event, context]) {
  let outputEvents = {};
  if (event && event.time) {
    outputEvents = await processorInitialise.processEvent(event, context);
  } else if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log("Invalid event format or missing time field");
  }
  return [outputEvents, context];
}

module.exports.receive = receive;
