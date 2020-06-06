var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './ts/build/build_client/client/client.js',
  output: {
    path: path.resolve(__dirname, "static/public"),
    filename: 'mudslinger-[contentHash].js'
  },
  plugins: [new HtmlWebpackPlugin({
      template: "./template.html",
      filename: path.resolve(__dirname, "static/public", "index.html")
  })],
  mode: 'production'
};