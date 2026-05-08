/**
 * Logging Configuration for Expense Tracker
 * ПР-10: Structured logging with JSON and text formats
 */

// Log levels (from lowest to highest priority)
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
};

const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

// ANSI color codes for console output
const COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARNING: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

/**
 * Logger class - structured logging with multiple formats
 */
class Logger {
  constructor(name, options = {}) {
    this.name = name;
    this.level = options.level || 'INFO';
    this.jsonFormat = options.jsonFormat || false;
    this.minLevel = LOG_LEVELS[this.level] || LOG_LEVELS.INFO;
  }

  /**
   * Format log entry as JSON (for production/monitoring systems)
   */
  _formatJSON(level, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level,
      logger: this.name,
      message: message,
      ...meta
    };

    // Add exception info if present
    if (meta.error && meta.error instanceof Error) {
      entry.exception = {
        name: meta.error.name,
        message: meta.error.message,
        stack: meta.error.stack
      };
      delete entry.error;
    }

    return JSON.stringify(entry);
  }

  /**
   * Format log entry as text (for development)
   */
  _formatText(level, message, meta = {}) {
    const timestamp = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    const color = COLORS[level] || '';
    const reset = COLORS.RESET;
    const levelPadded = level.padEnd(8);
    
    let output = `${timestamp} ${color}[${levelPadded}]${reset} ${this.name}: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      const metaCopy = { ...meta };
      if (metaCopy.error instanceof Error) {
        metaCopy.error = metaCopy.error.message;
      }
      output += ` ${JSON.stringify(metaCopy)}`;
    }

    return output;
  }

  /**
   * Core logging method
   */
  _log(level, message, meta = {}) {
    const levelValue = LOG_LEVELS[level];
    
    // Skip if below minimum level
    if (levelValue < this.minLevel) {
      return;
    }

    const formatted = this.jsonFormat
      ? this._formatJSON(level, message, meta)
      : this._formatText(level, message, meta);

    // Output to appropriate stream
    if (levelValue >= LOG_LEVELS.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * DEBUG level - detailed diagnostic information
   */
  debug(message, meta = {}) {
    this._log('DEBUG', message, meta);
  }

  /**
   * INFO level - confirmation of normal operation
   */
  info(message, meta = {}) {
    this._log('INFO', message, meta);
  }

  /**
   * WARNING level - unexpected but handled situation
   */
  warning(message, meta = {}) {
    this._log('WARNING', message, meta);
  }

  /**
   * ERROR level - serious problem, function failed
   */
  error(message, meta = {}) {
    this._log('ERROR', message, meta);
  }

  /**
   * CRITICAL level - system-level failure
   */
  critical(message, meta = {}) {
    this._log('CRITICAL', message, meta);
  }

  /**
   * Log exception with full stack trace
   */
  exception(message, error) {
    this._log('ERROR', message, { 
      error: error,
      stack: error.stack 
    });
  }
}

// Global logger registry
const loggers = new Map();

/**
 * Get or create logger instance
 * @param {string} name - Logger name (usually module name)
 * @returns {Logger}
 */
function getLogger(name) {
  if (!loggers.has(name)) {
    const options = {
      level: process.env.LOG_LEVEL || 'INFO',
      jsonFormat: process.env.LOG_FORMAT === 'json'
    };
    loggers.set(name, new Logger(name, options));
  }
  return loggers.get(name);
}

/**
 * Setup logging for entire application
 * Call once at application startup
 */
function setupLogging(options = {}) {
  const level = options.level || process.env.LOG_LEVEL || 'INFO';
  const jsonFormat = options.jsonFormat !== undefined 
    ? options.jsonFormat 
    : process.env.LOG_FORMAT === 'json';

  // Clear existing loggers
  loggers.clear();

  // Create root logger
  const rootLogger = new Logger('root', { level, jsonFormat });
  loggers.set('root', rootLogger);

  rootLogger.info('Logging system initialized', {
    level: level,
    format: jsonFormat ? 'JSON' : 'TEXT',
    environment: process.env.NODE_ENV || 'development'
  });

  return rootLogger;
}

/**
 * Create request logging middleware
 */
function requestLogger() {
  const logger = getLogger('http');
  
  return (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'error' : 'info';
      
      logger[level]('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    });

    next();
  };
}

/**
 * Error logging middleware
 */
function errorLogger() {
  const logger = getLogger('error');
  
  return (err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err,
      method: req.method,
      path: req.path,
      stack: err.stack
    });
    
    next(err);
  };
}

module.exports = {
  Logger,
  getLogger,
  setupLogging,
  requestLogger,
  errorLogger,
  LOG_LEVELS
};
