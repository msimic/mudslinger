var config = {};


config.serverHost = "0.0.0.0";
config.serverPort = 80;

config.adminHost = "localhost";
config.adminPort = 8001;

/* if left null, will not attempt to connect to api server */
config.apiHost = null;
config.apiPort = null;
config.apiKey = null;


module.exports = config;
