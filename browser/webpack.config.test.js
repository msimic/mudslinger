var path = require('path');

module.exports = {
  entry: './build/test/browser/test/testMain.js',
  output: {
    path: path.resolve(__dirname + "/static/test/"),
    filename: 'mudslingerTest.js'
  },
  mode: "development"
};