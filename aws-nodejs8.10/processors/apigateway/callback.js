function doCallback(callback, out) {
  // if we have a meta response on the first event, use that as the callback output (useful for API GW for example)
  if (out.events && Array.isArray(out.events) && out.events[0].meta && out.events[0].meta.response) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('meta.response present with value: ', out.events[0].meta.response);
    }
    callback(null, out.events[0].meta.response);
  } else {
    callback(null, out.msg);
  }
}

module.exports.doCallback = doCallback;
