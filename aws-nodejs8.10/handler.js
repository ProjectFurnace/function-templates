const logic = require(".");

if (logic.setup) logic.setup();

exports.handler = function(event, context, callback) {   
    try {
        callback(null, logic.handler(event));
    }
    catch (e) {
        callback(e)
    }
}