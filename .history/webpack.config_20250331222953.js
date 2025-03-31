const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: './src/lambda.ts', // Adjust to your entry point
  target: 'node',
  externals: [
    nodeExternals({
  ],
  output: {
    filename: 'lambda.js',
    path: path.resolve(__dirname, 'dist/src'),
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
};
