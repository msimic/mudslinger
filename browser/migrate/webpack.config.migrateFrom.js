var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'build/migrate.js'),
  output: {
    path: path.resolve(__dirname, "static/migrate_from"),
    filename: 'migrate-[contentHash].js'
  },
  plugins: [new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/html/migrate_from.html"),
      filename: path.resolve(__dirname, "static/migrate_from", "index.html")
  })],
  mode: 'development'
};