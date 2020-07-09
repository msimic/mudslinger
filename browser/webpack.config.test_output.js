var path = require('path');

module.exports = {
  entry: './build/test/browser/test/test_output/main.js',
  output: {
    path: path.resolve(__dirname + "/static/test/"),
    filename: 'mudslingerTestOutput.js'
  },
  mode: "development"
};