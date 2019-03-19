module.exports.pipe = (...functions) => input => functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

module.exports.tryCatch = (opts) => {
  return (args) => {
    try {
      return opts.tryer(args);
    } catch (e) {
      return opts.catcher(args, e);
    }
  };
};

const curry = (f, arr = []) => 
(...args) => (
  a => a.length === f.length ?
    f(...a) :
    curry(f, a)
)([...arr, ...args]);

module.exports.curry = curry;