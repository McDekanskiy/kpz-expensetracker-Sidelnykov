function withTimer(fn) {
  return async function timed(...args) {
    const start = Date.now();
    const result = await fn(...args);
    console.log(`[timer] ${fn.name || 'anonymous'}: ${Date.now() - start}ms`);
    return result;
  };
}

function withRetry(fn, times = 3) {
  return async function retrying(...args) {
    let lastError;
    for (let attempt = 1; attempt <= times; attempt += 1) {
      try { return await fn(...args); } catch (error) { lastError = error; }
    }
    throw lastError;
  };
}

module.exports = { withTimer, withRetry };
