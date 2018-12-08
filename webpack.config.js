const path = require('path')
const webpack = require('webpack')
const root = path.resolve(__dirname)

module.exports = {
  optimization: {
    nodeEnv: 'dev',
  },
  mode: 'development',
  entry: {
    formux: './src/index.js',
    render: './render.js'
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader', 'eslint-loader'],
        exclude: /node_modules/,
      }
    ],
  },


  context: __dirname,
  node: {
    __filename: true,
    __dirname: true,
  },

  devtool: 'inline-source-map',
}
