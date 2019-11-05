const processorInitialise = require('../lib/initialise');

async function receive(event) {
  let outputEvents = {};
  if (event && event.time) {
    outputEvents = await processorInitialise.processEvent(event);
  } else if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log('Invalid event format or missing time field');
  }
  return outputEvents;
}

module.exports.receive = receive;
