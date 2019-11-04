const processorInitialise = require('../lib/initialise');

async function receive(events) {
  const outputEvents = [];
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii] && events[ii].body) {
      const event = JSON.parse(events[ii].body);
      // eslint-disable-next-line no-await-in-loop
      outputEvents.push(...(await processorInitialise.processEvent(event)));
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No "body" property in received events');
    }
  }
  return outputEvents;
}

module.exports.receive = receive;
