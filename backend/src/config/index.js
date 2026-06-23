const env = process.env.NODE_ENV || 'development';

let config = {};

if (env === 'production') {
  config = require('./production');
} else {
  config = require('./development');
}

module.exports = config;
