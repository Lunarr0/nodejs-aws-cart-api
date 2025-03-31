const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: './src/lambda.ts', // Adjust to your entry point
  target: 'node', // Specify Node.js environment
  //externals: [nodeExternals()], // Exclude node_modules
  output: {
    filename: 'lambda.js', // The name of the output file
    path: path.resolve(__dirname, 'dist/src'), // Output directory
    libraryTarget: 'commonjs2', // Set library target for Lambda
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve .ts and .js files
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // Apply the loader to TypeScript files
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
