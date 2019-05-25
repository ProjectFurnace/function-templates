const logic = require('./index');

module.exports = async function run(context, eventInput) {
  if (process.env.DEBUG) {
    context.log('EventHub trigger processed an event', eventInput);
  }

  const output = await logic.handler(eventInput, context);

  context.done(null, output);
};
