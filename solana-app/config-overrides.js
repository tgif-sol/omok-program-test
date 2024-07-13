const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url/'),
  };
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  return config;
};
