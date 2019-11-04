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
    if (event.event && event.meta) {
      out = await logic.handler(event.event, event.meta);
    } else {
      out = await logic.handler(event);
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (event.event && event.meta) {
      out = await furnaceSDK.fp.pipe(
        ...funcArray,
      )(event.event, event.meta);
    } else {
      out = await furnaceSDK.fp.pipe(
        ...funcArray,
      )(event);
    }
  }
  // we want to always return an array
  if (!Array.isArray(out)) {
    return [out];
  }
  return out;
}

exports.processEvent = processEvent;
