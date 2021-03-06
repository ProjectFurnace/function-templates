const processorInitialise = require("../lib/initialise");

async function receive([events, context]) {
  const output = { events: [] };
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii] && events[ii].body) {
      const event = JSON.parse(events[ii].body);
      // eslint-disable-next-line no-await-in-loop
      const handlerOutput = await processorInitialise.processEvent(
        event,
        context
      );
      output.events.push(...handlerOutput.events);
      if (handlerOutput.response) {
        output.response = handlerOutput.response;
      }
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No "body" property in received events');
    }
  }
  return [output, context];
}

module.exports.receive = receive;
