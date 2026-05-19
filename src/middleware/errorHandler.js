const { getLogger } = require('../core/logging');
const logger = getLogger('error-handler');

function errorHandler(err, req, res, next) {
  logger.error(err.message, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Unexpected error',
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler };
