Mudslinger is a web based MUD client.

Core technologies used: Node.js, Socket.IO, Flask

Languages used: Typescript, HTML, CSS, Python

The Node.js Socket.IO server makes telnet connections to the target host/port and acts as a telnet proxy to the browser.

Live version at: [https://mudslinger.net/play/](https://mudslinger.net/play/)

Host and port can also be passed as URL parameters, e.g. [https://mudslinger.net/play/?host=aarchonmud.com&port=7000](https://mudslinger.net/play/?host=aarchonmud.com&port=7000)

# Features #
* ANSI color
* XTERM 256 colors
* UTF-8
* MXP support (``<image>``, ``<send>``, ``<a>``, ``<i>``, ``<b>``, ``<u>``, and ``<s>`` tags)
* Triggers (basic and regex)
* Aliases (basic and regex)
* [Scripting support (Javascript)](scripting.md)

# License
[MIT](LICENSE)
