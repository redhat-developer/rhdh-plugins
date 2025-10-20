'use strict';

require('fs-extra');
require('os');

async function retryAsyncFunction(args) {
  let result;
  for (let i = 0; i < args.maxAttempts; i++) {
    result = await args.asyncFn();
    if (result !== void 0) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, args.delayMs));
  }
  throw new Error("Exceeded maximum number of retries for async function");
}
async function executeWithRetry(action, maxErrors = 15) {
  let response;
  let errorCount = 0;
  const backoff = 5e3;
  while (errorCount < maxErrors) {
    try {
      response = await action();
      if (response.status >= 400) {
        errorCount++;
        await delay(backoff);
      } else {
        return response;
      }
    } catch (e) {
      errorCount++;
      await delay(backoff);
    }
  }
  throw new Error("Unable to execute query.");
}
function delay(time) {
  return new Promise((r) => setTimeout(r, time));
}

exports.delay = delay;
exports.executeWithRetry = executeWithRetry;
exports.retryAsyncFunction = retryAsyncFunction;
//# sourceMappingURL=Helper.cjs.js.map
