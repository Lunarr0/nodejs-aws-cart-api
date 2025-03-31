const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/lambda.ts',
  target: 'node',
  output: {
    filename: 'lambda.js',
    path: path.resolve(__dirname, 'dist'), // Changed from dist/src to dist
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        const lazyImports = [
          '@nestjs/microservices',
          '@nestjs/websockets',
          'cache-manager',
          'class-validator',
          'class-transformer',
          '@nestjs/microservices/microservices-module',
          '@nestjs/websockets/socket-module',
          'fastify-static',
          'kafkajs',
          'mqtt',
          'nats',
          'redis',
          'ioredis'
        ];
        return lazyImports.includes(resource);
      },
    }),
  ],
  optimization: {
    minimize: true
  }
};
