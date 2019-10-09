const fs = require('fs');
const path = require('path');
const furnaceSDK = require('@project-furnace/sdk');

const funcArray = [];
let logic;

if (process.env.COMBINE) {
  // eslint-disable-next-line global-require
  const funcs = require('require-all')({
    dirname: path.join(__dirname, 'combined'),
    filter: /(index)\.js$/,
  });

  const funcOrder = process.env.COMBINE.split(',');

  // eslint-disable-next-line no-restricted-syntax
  for (const func of funcOrder) {
    if (funcs[func].azure) {
      funcArray.push(funcs[func].azure.index.handler);
    } else {
      funcArray.push(funcs[func].index.handler);
    }
  }
} else {
  let logicPath = './index';
  if (fs.existsSync('./azure/')) {
    logicPath = './azure/index';
  }

  // eslint-disable-next-line global-require
  logic = require(logicPath);
}

module.exports.processEvent = async function processEvent(context, eventInput) {
  if (process.env.DEBUG) {
    context.log('EventHub trigger processed an event', eventInput);
  }

  let output;

  if (!process.env.COMBINE) {
    // we are using a for loop that allows for async
    // eslint-disable-next-line no-await-in-loop
    output = await logic.handler(eventInput, context);
  } else {
    // eslint-disable-next-line no-await-in-loop
    output = await furnaceSDK.fp.pipe(
      ...funcArray,
    )(eventInput, context);
  }

  context.done(null, output);
};

