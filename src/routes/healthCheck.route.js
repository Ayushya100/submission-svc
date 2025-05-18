'use strict';

import os from 'os';
import { logger, buildApiResponse } from 'common-node-lib';

const log = logger('Router: health-check');

// API Function
const healthCheck = (req, res, next) => {
  try {
    log.info('Health check successfull');
    log.info(`Service is healthy. Uptime : ${process.uptime()} seconds | Timestamp : ${new Date().toISOString()} | Hostname : ${os.hostname()}`);

    res.status(200).json(
      buildApiResponse({
        status: 200,
        data: {
          uptime: `${String(process.uptime())} seconds`,
          timestamp: new Date().toISOString(),
          hostname: os.hostname(),
        },
        message: 'Service is healthy.',
      })
    );
  } catch (err) {
    log.error(`Health check failed! Error : ${err.message}`);
    next({
      status: 500,
      message: 'Service is unhealthy',
      data: [],
      errors: err,
      stack: err.stack,
    });
  }
};

export default healthCheck;
