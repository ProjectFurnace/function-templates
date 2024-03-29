const furnaceSDK = require("@project-furnace/sdk");
const { lookup, queue } = require("@project-furnace/sdk-aws");

const path = require("path");

let funcList;
const funcArray = [];
let logic;

let setupComplete = false;

module.exports.processEvent = async (payload, context) => {
  if (!setupComplete) setup();

  let out;
  if (!process.env.COMBINE) {
    if (payload.data && payload.meta) {
      out = await logic.handler(payload.data, payload.meta, getUtils(context));
    } else {
      out = await logic.handler(payload, {}, getUtils(context));
    }
  } else {
    let event, meta;
    if (payload.data && payload.meta) {
      event = payload.data;
      meta = payload.meta;
    } else {
      event = payload;
      meta = {};
    }

    out = event;

    for (let func of funcArray) {
      try {
        out = await func(out, meta, getUtils(context));

        if (!out) break; // we have no output stop processing pipeline
      } catch (error) {
        const newError = new Error(
          `error executing function ${funcList[funcArray.indexOf(func)]}`
        );
        newError.original = error;
        newError.stack = error.stack;

        throw newError;
      }
    }
  }
  /** standarize response to {response: x, events: [{...data...},{...data...},{...data...}....]}
   * there are 4 cases to consider (plus the ones with meta in which the event itself is {data: ..., meta: ...}):
   * 1. just an event, no meta, no response: {…data…}
   * 2. multiple events, no meta, no response: [{...data...},{...data...},{...data...}....]
   * 3. single event, response, no meta: {response: x, event: {...data...}}
   * 4. multiple events, response, no meta: {response: x, events: [{...data...},{...data...},{...data...}....]}
   */
  // if no output at all return an empty object
  if (!out) {
    if (process.env.DEBUG) {
      console.log("No output from handler function");
    }
    return { events: [] };
  }

  // if we only have an array of events coming from the handler
  if (Array.isArray(out)) {
    return { events: out };
  }

  // if we have a single event in the output
  if (out.event) {
    out.events = out.event === {} ? [] : [out.event];
    delete out.event;
    return out;
  }

  // if we have an object with an events property being an array or a response property
  if ((out.events && Array.isArray(out.events)) || out.response) {
    if (out.events === [{}]) {
      out.events = [];
    }
    return out;
  }

  // if it's just a single event
  return { events: [out] };
};

function getUtils(context) {
  return { context, lookup, queue };
}

function setup() {
  if (process.env.COMBINE) {
    // eslint-disable-next-line global-require
    const funcs = require("require-all")({
      dirname: path.join(__dirname, "../..", "combined"),
      filter: /(index)\.js$/,
    });

    funcList = process.env.COMBINE.split(",");

    // eslint-disable-next-line no-restricted-syntax
    for (const func of funcList) {
      funcArray.push(funcs[func].index.handler);
    }
  } else {
    let logicPath = process.env.LOGIC_PATH || "../../index";

    // eslint-disable-next-line global-require
    logic = require(logicPath);
  }

  setupComplete = true;
}
