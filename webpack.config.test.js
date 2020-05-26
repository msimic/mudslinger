var path = require('path');

module.exports = {
  entry: './ts/build/build_client_test/test/client/testMain.js',
  output: {
    path: path.resolve(__dirname + "/static/test/"),
    filename: 'mudslingerTest.js'
  },
  mode: "development"
};