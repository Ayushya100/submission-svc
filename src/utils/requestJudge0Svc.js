'use strict';

import { logger } from 'common-node-lib';
import axios from 'axios';

const log = logger('util: request-judge0-svc');

const externalSvcConfig = {};
const initializeSvc = (port, protocol) => {
  log.info('Judge0 External service configuration initiated');
  const host = process.env.NODE_ENV === 'dev' ? `${protocol}://${process.env.JUDGE0_HOST}:${port}` : ``;
  externalSvcConfig.host = host;
  log.info('Judge0 External service configuration completed');
};

const sendRequest = async (path, method, payload, params = null) => {
  try {
    log.info('Judge0 External service request operation initiated');

    const baseUrl = `${externalSvcConfig.host}/${path}`;
    const options = {
      method: method,
      url: baseUrl,
      baseURL: baseUrl,
      data: payload,
      timeout: 50000,
      responseType: 'json',
    };

    if (params) {
      options['params'] = params;
    }

    let response;
    await axios(options)
      .then((res) => {
        log.info('Success - Judge0 External service request operation completed');
        response = {
          status: res.status,
          message: res.statusText,
          data: res.data,
          isValid: true,
        };
      })
      .catch((err) => {
        log.error('Error while handling the Judge0 external service request');
        response = {
          status: err.response.status,
          message: err.response.data.error,
          errors: err,
          isValid: false,
        };
      });
    return response;
  } catch (err) {
    log.error('Judge0 External service request operation failed');
    return {
      status: 500,
      message: 'Some error occurred while handling Judge0 service request',
      errors: err,
      isValid: false,
    };
  }
};

const batchSubmission = async (protocol, payload) => {
  const url = 'submissions/batch?base64_encoded=false';
  const method = 'POST';
  const judge0Port = process.env.JUDGE0_PORT;
  payload = {
    submissions: payload,
  };

  initializeSvc(judge0Port, protocol);
  const response = await sendRequest(url, method, payload);
  return response;
};

const batchResult = async (protocol, params) => {
  const url = 'submissions/batch';
  const method = 'GET';

  const response = await sendRequest(url, method, null, params);
  return response;
};

export { batchSubmission, batchResult };
