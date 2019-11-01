const furnaceSDK = require('@project-furnace/sdk');
const processorInitialise = require('../lib/initialise');

const { logic, funcArray } = processorInitialise;

const type = 'API_GATEWAY';

async function receive(event) {
  const outputEvents = [];
  if (event) {
    if (!process.env.COMBINE) {
      outputEvents.push(await logic.handler(event));
    } else {
      const out = await furnaceSDK.fp.pipe(
        ...funcArray,
      )(event);
      outputEvents.push(out);
    }
  } else if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log('Invalid event format or missing body field');
  }
  return outputEvents;
}

module.exports = { type, receive };
