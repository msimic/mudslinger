var path = require('path');

module.exports = {
  entry: './ts/build/build_client/client/client.js',
  output: {
    path: path.resolve(__dirname + "/static/public/"),
    filename: 'mudslinger.js'
  },
  mode: "development"
};