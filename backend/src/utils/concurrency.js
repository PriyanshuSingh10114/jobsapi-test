/**
 * Limits concurrent promise execution.
 * Similar to p-limit package but zero-dependency.
 * @param {number} concurrency - Max number of promises to run concurrently.
 * @returns {function} limit - Function to wrap your promises.
 */
function pLimit(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }

  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn, resolve, args) => {
    activeCount++;
    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      resolve(error); // We resolve errors to avoid unhandled rejections breaking Promise.all
    }
    next();
  };

  const enqueue = (fn, resolve, args) => {
    queue.push(run.bind(null, fn, resolve, args));
    if (activeCount < concurrency && queue.length > 0) {
      queue.shift()();
    }
  };

  const generator = (fn, ...args) => {
    return new Promise(resolve => {
      enqueue(fn, resolve, args);
    });
  };

  return generator;
}

module.exports = pLimit;
