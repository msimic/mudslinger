import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as net from "net";
import * as fs from "fs";
import * as readline from "readline";

import { IoEvent } from "../shared/ioevent";

let serverConfig = require("../../configServer.js");
console.log(serverConfig);

let cwd = process.cwd();

let telnetIdNext: number = 0;

interface connInfo {
    telnetId: number;
    userIp: string;
    host: string;
    port: number;
};

let openConns: {[k: number]: connInfo} = {};

let server: http.Server = http.createServer();
let io: SocketIO.Server = socketio();

let telnetNs: SocketIO.Namespace = io.of("/telnet");
telnetNs.on("connection", (client: SocketIO.Socket) => {
    let telnet: net.Socket;
    let ioEvt = new IoEvent(client);
    let remoteAddr = client.request.headers['x-real-ip'] || client.request.connection.remoteAddress;

    let writeQueue: any[] = [];
    let canWrite: boolean =  true;
    let checkWrite = () => {
        if (!canWrite) { return; }

        if (writeQueue.length > 0) {
            let data = writeQueue.shift();
            canWrite = false;
            canWrite = telnet.write(data as Buffer);
        }
    };

    let writeData = (data: any) => {
        writeQueue.push(data);
        checkWrite();
    };

    client.on("disconnect", () => {
        if (telnet) {
            telnet.end();
            telnet = null;
        }
    });

    ioEvt.clReqTelnetOpen.handle((args: [string, number]) => {
        telnet = new net.Socket();

        let telnetId: number = telnetIdNext++;

        let host: string;
        let port: number;

        let conStartTime: Date;

        if (serverConfig.targetHost != null) {
            host = serverConfig.targetHost;
            port = serverConfig.targetPort;
        } else {
            host = args[0];
            port = args[1];
        }

        openConns[telnetId] = {
            telnetId: telnetId,
            userIp: remoteAddr,
            host: host,
            port: port,
        };

        telnet.on("data", (data: Buffer) => {
            ioEvt.srvTelnetData.fire(data.buffer);
        });
        telnet.on("close", (had_error: boolean) => {
            delete openConns[telnetId];
            ioEvt.srvTelnetClosed.fire(had_error);
            telnet = null;
            let elapsed: number = <any>(new Date()) - <any>conStartTime;
            tlog(telnetId, "::", remoteAddr, "->", host, port, "::closed after", (elapsed/1000), "seconds");
        });
        telnet.on("drain", () => {
            canWrite = true;
            checkWrite();
        });
        telnet.on("error", (err: Error) => {
            tlog(telnetId, "::", "TELNET ERROR:", err);
            ioEvt.srvTelnetError.fire(err.message);
        });

        try {
            tlog(telnetId, "::", remoteAddr, "->", host, port, "::opening");
            telnet.connect(port, host, () => {
                ioEvt.srvTelnetOpened.fire(null);
                conStartTime = new Date();
            });
        }
        catch (err) {
            delete openConns[telnetId];
            tlog(telnetId, "::", "ERROR CONNECTING TELNET:", err);
            ioEvt.srvTelnetError.fire(err.message);
        }
    });

    ioEvt.clReqTelnetClose.handle(() => {
        if (telnet == null) { return; }
        telnet.end();
        telnet = null;
    });

    ioEvt.clReqTelnetWrite.handle((data) => {
        if (telnet == null) { return; }
        writeData(data);
    });

    ioEvt.srvSetClientIp.fire(remoteAddr);
});

if (serverConfig.serveStatic) {
    let express_app = express();
    server.on("request", express_app);

    express_app.use(express.static("static/public"));

    if (serverConfig.serveStaticTest) {
        express_app.use('/test', express.static("static/test", {
            index: "test.html"
        }));
    }

    express_app.use((err: any, req: any, res: any, next: any) => {
        tlog("Express app error: " +
                    "err: " + err + " | " +
                    "req: " + req + " | " +
                    "res: " + res + " | ");
        next(err);
    });
}

io.attach(server);

server.on("error", (err: Error) => {
    tlog("Server error:", err);
});

server.listen(serverConfig.serverPort, serverConfig.serverHost, () => {
    tlog("Server is running on " + serverConfig.serverHost + ":" + serverConfig.serverPort);
});

function tlog(...args: any[]) {
    console.log("[[", new Date().toLocaleString(), "]]", ...args);
}

if (process.platform !== "win32") {
    let adminIdNext: number = 0;

    type adminFunc = (sock: net.Socket, args: string[]) => void;


    let adminFuncs: {[k: string]: adminFunc} =  {};
    adminFuncs["help"] = (sock: net.Socket, args: string[]) => {
        sock.write("Available commands:\n\n");
        for (let cmd in adminFuncs) {
            sock.write(cmd + "\n");
        }
        sock.write("\n");
    };

    adminFuncs["ls"] = (sock: net.Socket, args: string[]) => {
        sock.write("Open connections:\n\n");
        for (let tnId in openConns) {
            let o = openConns[tnId];
            sock.write( o.telnetId.toString() + 
                        ": " + o.userIp  +
                        " => " + o.host + "," + o.port.toString() +
                        "\n");
        }
    };

    let adminServer = net.createServer((socket: net.Socket) => {
        let adminId: number = adminIdNext++;

        tlog("{{", adminId, "}}", "{{admin connection opened}}");

        let rl = readline.createInterface({
            input: socket
        });

        rl.on("line", (line: string) => {
            let words = line.split(" ");

            if (words.length > 0) {
                let funcName = words[0];
                if (funcName === "exit") {
                    socket.end();
                    return;
                }

                let afunc = adminFuncs[words[0]];

                if (!afunc) {
                    socket.write("No such command. Try 'help'.\n");
                } else {
                    try {
                        afunc(socket, words.slice(1));
                    }
                    catch (err) {
                        tlog("{{", adminId, "}}", "{{admin error '" + line + "':", err, "}}");
                        socket.write("COMMAND ERROR\n");
                    }
                }
            }

            socket.write("admin> ");
        });

        socket.on("close", () => {
            tlog("{{", adminId, "}}", "{{admin closed}}");
        });

        socket.on("error", (err: Error) => {
            tlog("{{", adminId, "}}", "{{admin error: " + err);
        });

        socket.write("admin> ");
    });

    adminServer.listen(serverConfig.adminPort, serverConfig.adminHost, () => {
        tlog("Admin CLI server is running on " + serverConfig.adminHost + ":" + serverConfig.adminPort);
    });
}
