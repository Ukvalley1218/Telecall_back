/**
 * Simple logging utility
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta = null) => {
  const timestamp = formatTimestamp();
  let logMessage = `[${timestamp}] ${level}: ${message}`;

  if (meta) {
    logMessage += ` | ${JSON.stringify(meta)}`;
  }

  return logMessage;
};

const logger = {
  error: (message, meta = null) => {
    console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
  },

  warn: (message, meta = null) => {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
  },

  info: (message, meta = null) => {
    console.info(formatMessage(LOG_LEVELS.INFO, message, meta));
  },

  debug: (message, meta = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  },

  // HTTP request logging
  request: (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress
      };

      if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    });

    next();
  }
};

export default logger;