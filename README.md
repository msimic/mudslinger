Mudslinger is a web based MUD client written in Typescript. 
It consists of a Node.js / Express web server and a HTML/CSS/Javascript frontend.

The Node.js server makes telnet connections to the target host/port and acts as a telnet proxy for the frontend application.

It can be configured to connect only to a specific host/port or allow connections to any host/port.

Live version at: [https://mudslinger.rooflez.com](https://mudslinger.rooflez.com)

Host and port can also be passed as URL parameters, e.g. [https://mudslinger.rooflez.com/?host=aarchonmud.com&port=7000](https://mudslinger.rooflez.com/?host=aarchonmud.com&port=7000)

# Features #
* ANSI color
* XTERM 256 colors
* UTF-8
* MXP support (``<image>``, ``<send>``, ``<a>``, ``<i>``, ``<b>``, ``<u>``, and ``<s>`` tags)
* Triggers (basic and regex)
* Aliases (basic and regex)
* [Scripting support (Javascript)](scripting.md)


# Getting started #
1. Run ``npm ci`` in the root directory.
  * Ensure ``tools/postinstall.js`` ran after the install finished (it should happen automatically). If not, manually run it with ``node tools/postinstall.js``.
2. ``npm run build`` to build the server and client.
3. Edit `static/public/configClient.js` and `configServer.js` as needed.
4. ``npm start`` to start the server.

# License
[MIT](LICENSE)
