const furnaceSDK = require('@project-furnace/sdk');
const processorInitialise = require('../lib/initialise');

const { logic, funcArray } = processorInitialise;

async function receive(events) {
  const outputEvents = [];
  for (let ii = 0; ii < events.length; ii += 1) {
    if (events[ii] && events[ii].s3) {
      const event = events[ii];
      // we are using a for loop that allows for async
      // eslint-disable-next-line no-await-in-loop
      if (!process.env.COMBINE) {
        // we are using a for loop that allows for async
        // eslint-disable-next-line no-await-in-loop
        outputEvents.push(await logic.handler(event));
      } else {
        // eslint-disable-next-line no-await-in-loop
        const out = await furnaceSDK.fp.pipe(
          ...funcArray,
        )(event);
        outputEvents.push(out);
      }
    } else if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('No "s3" property in received events');
    }
  }
  return outputEvents;
}

module.exports.receive = receive;
