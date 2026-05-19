function getLogger(scope = 'app') {
  const format = (level, message, meta = {}) => {
    const payload = {
      time: new Date().toISOString(),
      level,
      scope,
      message,
      ...meta
    };
    return JSON.stringify(payload);
  };

  return {
    info: (message, meta) => console.log(format('info', message, meta)),
    warn: (message, meta) => console.warn(format('warn', message, meta)),
    error: (message, meta) => console.error(format('error', message, meta))
  };
}

module.exports = { getLogger };
