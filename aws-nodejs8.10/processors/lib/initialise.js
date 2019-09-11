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

exports.funcArray = funcArray;
exports.logic = logic;
