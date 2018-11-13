const logic = require(".");

exports.handler = function(event, context, callback) {   
    try {
        callback(null, logic(event));
    }
    catch (e) {
        callback(e)
    }
}