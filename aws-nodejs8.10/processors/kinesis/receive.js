const processorInitialise = require("../lib/initialise");

async function receive(events, context) {
  const output = { events: [] };
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii].kinesis && events[ii].kinesis.data) {
      const event = JSON.parse(Buffer.from(events[ii].kinesis.data, "base64"));
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
      console.log('No "kinesis" or "data" properties in events received');
    }
  }
  return output;
}

module.exports.receive = receive;
