function doCallback(callback, out) {
  callback(null, out.msg);
}

module.exports.doCallback = doCallback;
