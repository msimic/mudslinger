var config = {};


config.serverHost = "0.0.0.0";
config.serverPort = 80;

config.adminHost = "localhost";
config.adminPort = 8001;

/* if left null, will not attempt to connect to api server */
config.apiHost = null;
config.apiPort = null;
config.apiKey = null;

/* targetHost and targetPort set as null means client can connect to any host/port.
Set these values to hardcode the connection to a specific host and port 

If hardcoding a target, be sure to also set hardcodedTarget to true in configClient.js
*/
config.targetHost = null; 
config.targetPort = null;


module.exports = config;
