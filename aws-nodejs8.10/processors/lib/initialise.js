const furnaceSDK = require('@project-furnace/sdk');
const fs = require('fs');
const path = require('path');

const funcArray = [];
let logic;

if (process.env.COMBINE) {
  // eslint-disable-next-line global-require
  const funcs = require('require-all')({
    dirname: path.join(__dirname, '../..', 'combined'),
    filter: /(index)\.js$/,
  });

  const funcOrder = process.env.COMBINE.split(',');

  // eslint-disable-next-line no-restricted-syntax
  for (const func of funcOrder) {
    if (funcs[func].aws) {
      funcArray.push(funcs[func].aws.index.handler);
    } else {
      funcArray.push(funcs[func].index.handler);
    }
  }
} else {
  let logicPath = '../../index';
  if (fs.existsSync('../../aws/')) {
    logicPath = '../../aws/index';
  }

  // eslint-disable-next-line global-require
  logic = require(logicPath);
}

async function processEvent(event) {
  let out;
  if (!process.env.COMBINE) {
    if (event.data && event.meta) {
      out = await logic.handler(event.data, event.meta);
    } else {
      out = await logic.handler(event);
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (event.data && event.meta) {
      out = await furnaceSDK.fp.pipe(
        ...funcArray,
      )(event.data, event.meta);
    } else {
      out = await furnaceSDK.fp.pipe(
        ...funcArray,
      )(event);
    }
  }
  // standarize response to {response: x, events: [{...data...},{...data...},{...data...}....]}
  // if no output at all return an empty object
  if (!out) {
    if (process.env.DEBUG) {
      console.log('No output from handler function');
    }
    return { events: {} };
  }

  // if we only have an array of events coming from the handler 
  if (Array.isArray(out)) {
    return { events: out };
  }

  // if we have an object with the events key defined
  if (out.events) {
    // if events is not an array
    if (!Array.isArray(out.events)) {
      out.events = [out.events];
    }
    return out;
  }

  // if it's only response but no event
  if (out.response) {
    return out;
  }
  // if it's just a single event
  return { events: [out] };
}

exports.processEvent = processEvent;
