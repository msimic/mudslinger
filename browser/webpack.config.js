var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './build/browser/src/ts/client.js',
  output: {
    path: path.resolve(__dirname, "static/public"),
    filename: 'mudslinger-[contentHash].js'
  },
  plugins: [new HtmlWebpackPlugin({
      template: "./src/html/template.html",
      filename: path.resolve(__dirname, "static/public", "index.html")
  })],
  mode: 'production'
};