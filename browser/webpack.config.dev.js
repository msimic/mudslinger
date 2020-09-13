var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/ts/client',
  output: {
    path: path.resolve(__dirname, "static/public"),
    filename: 'mudslinger-[hash].js',
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  plugins: [
    new CleanWebpackPlugin({
      /*dry: true,*/
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['*.hot-update.json', '*.js', '!jquery*'],
    }),
    new HtmlWebpackPlugin({
      template: "./src/html/template.html",
      filename: path.resolve(__dirname, "static/public", "index.html")
  })],
  mode: 'development',
  devtool: 'eval-source-map', 
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts','.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  devServer: {
    contentBase: path.resolve(__dirname, "static/public/"),
    inline: true,
    writeToDisk: true,
    host: 'localhost',
    /*https: true,*/
    port: 8080,
  },
};