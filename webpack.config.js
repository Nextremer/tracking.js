const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: __dirname + '/src/tracking.js',
  output: {
    path: __dirname + '/build/',
    // publicPath: '/',
    filename: 'tracking.js',
    library: 'tracking',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel'
    },
    ]
  },
  plugins: [],
  externals: [nodeExternals()]
}

