const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const http = require('http');
const https = require('https');
const logger = require('../config/logger');

// Retry only for 429, 408, 500, 502, 503, 504, ECONNRESET, ETIMEDOUT
const RETRYABLE_STATUS_CODES = [429, 408, 500, 502, 503, 504];

const client = axios.create({
  timeout: 15000, // 15 seconds
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 })
});

// Using a custom intercepter to track retries per request
client.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now(), retries: 0 };
  return config;
});

axiosRetry(client, {
  retries: 3,
  retryDelay: (retryCount) => {
    // 1s, 2s, 4s
    const delays = [1000, 2000, 4000];
    return delays[retryCount - 1] || 4000;
  },
  retryCondition: (error) => {
    const isNetworkError = axiosRetry.isNetworkOrIdempotentRequestError(error);
    const isRetryableStatus = error.response && RETRYABLE_STATUS_CODES.includes(error.response.status);
    const isEconnReset = error.code === 'ECONNRESET';
    const isTimeout = error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED';

    return isNetworkError || isRetryableStatus || isEconnReset || isTimeout;
  },
  onRetry: (retryCount, error, requestConfig) => {
    if (requestConfig.metadata) {
      requestConfig.metadata.retries = retryCount;
    }
    logger.warn(`Retrying request to ${requestConfig.url}. Attempt ${retryCount}. Reason: ${error.message}`);
  }
});

const classifyError = (error) => {
  if (error.response) {
    const status = error.response.status;
    if (status === 404) return 'Endpoint Removed';
    if (status === 401) return 'Authentication Required';
    if (status === 403) return 'Forbidden';
    if (status === 422) return 'Invalid Request';
    if (status === 429) return 'Rate Limited';
    if (status >= 500) return 'Server Error';
    return `HTTP ${status}`;
  } else if (error.code) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Network Timeout';
    if (error.code === 'ENOTFOUND') return 'DNS Failure';
    if (error.code === 'ECONNRESET') return 'Connection Reset';
    if (error.code.includes('SSL')) return 'SSL Error';
    if (error.message && error.message.includes('JSON')) return 'JSON Error';
    return `Network Error: ${error.code}`;
  }
  return 'Unknown Error';
};

const fetchWithRetry = async (url, config = {}) => {
  const startTime = Date.now();
  let result = {
    data: null,
    error: null,
    errorClass: null,
    durationMs: 0,
    success: false,
    retries: 0
  };

  try {
    const response = await client.get(url, config);
    result.data = response.data;
    result.success = true;
    if (response.config && response.config.metadata) {
      result.retries = response.config.metadata.retries || 0;
    }
  } catch (error) {
    result.error = error.message;
    result.errorClass = classifyError(error);
    if (error.config && error.config.metadata) {
      result.retries = error.config.metadata.retries || 0;
    }
  } finally {
    result.durationMs = Date.now() - startTime;
  }

  return result;
};

module.exports = { client, fetchWithRetry, classifyError };
