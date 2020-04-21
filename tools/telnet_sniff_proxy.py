#!/usr/bin/env python3.6

"""
Simple tool to sniff and print telnet negotiations between server and client.

Example usage:
    Run `./telnet_sniff_proxy.py localhost 5959 aarchonmud.com 7000`
    Now connect to localhost 5959 in ZMud.
    It will be as if connecting directly to aarchonmud.com 7000 but all telnet negotations will be printed by the script.
"""
import logging
import re
import socket
import sys
import threading


LOG = logging.getLogger(__name__)


class TelnetCmds(object):
    SE = bytes([240])  # End of subnegotiation parameters
    NOP = bytes([241])  # No operation
    DM = bytes([242])  # Data mark
    BRK = bytes([243])  # Break
    IP = bytes([244])  # Suspend
    AO = bytes([245])  # Abort output
    AYT = bytes([246])  # Are you there
    EC = bytes([247])  # Erase character
    EL = bytes([248])  # Erase line
    GA = bytes([249])  # Go ahead
    SB = bytes([250])  # Go Subnegotiation
    WILL = bytes([251])  # will
    WONT = bytes([252])  # wont
    DO = bytes([253])  # do
    DONT = bytes([254])  # dont
    IAC = bytes([255])  # interpret as command
TelnetCmdName = {v: k for k, v in TelnetCmds.__dict__.items()}


class TelnetOpts(object):
    ECHO = bytes([1])
    SGA = bytes([3])
    STATUS = bytes([5])
    TM = bytes([6])
    TTYPE = bytes([24])
    NAWS = bytes([31])
    NEW_ENVIRON = bytes([39])
    CHARSET = bytes([42])
    MSDP = bytes([69])
    MSSP = bytes([70])
    MSP = bytes([90])
    MXP = bytes([91])
    ATCP = bytes([200])
TelnetOptName = {v: k for k, v in TelnetOpts.__dict__.items()}


class TelnetSubNeg(object):
    IS = bytes([0])
    SEND = bytes([1])
    ACCEPTED = bytes([2])
    REJECTED = bytes([3])
TelnetSubNegName = {v: k for k, v in TelnetSubNeg.__dict__.items()}


IAC  = bytes([255]) # "Interpret As Command"
DONT = bytes([254])
DO   = bytes([253])
WONT = bytes([252])
WILL = bytes([251])
theNULL = bytes([0])

SE  = bytes([240])  # Subnegotiation End
NOP = bytes([241])  # No Operation
DM  = bytes([242])  # Data Mark
BRK = bytes([243])  # Break
IP  = bytes([244])  # Interrupt process
AO  = bytes([245])  # Abort output
AYT = bytes([246])  # Are You There
EC  = bytes([247])  # Erase Character
EL  = bytes([248])  # Erase Line
GA  = bytes([249])  # Go Ahead
SB =  bytes([250])  # Subnegotiation Begin

NOOPT = bytes([0])


class TelnetSniffer(object):
    def __init__(self, in_sock, out_sock, name, option_callback):
        self.in_sock = in_sock
        self.out_sock = out_sock
        self.name = name
        self.option_callback = option_callback

        self.iacseq = b'' # Buffer for IAC sequence.
        self.sb = 0 # flag for SB and SE sequence.
        self.sbdataq = b''

    def start(self):
        while True:
            d = self.in_sock.recv(1024)

            if d == b'':
                LOG.info("%s connection closed", self.name)
                self.in_sock.close()
                return

            self._process(d)
            self.out_sock.sendall(d)

    def read_sb_data(self):
        buf = self.sbdataq
        self.sbdataq = b''
        return buf

    def _process(self, data):
        buf = [b'', b'']

        for b in data:
            c = bytes([b])
            if not self.iacseq:
                if c == theNULL and not self.sb:
                    continue
                if c == b"\021":
                    continue
                if c != IAC:
                    buf[self.sb] = buf[self.sb] + c
                    continue
                else:
                    self.iacseq += c
            elif len(self.iacseq) == 1:
                # 'IAC: IAC CMD [OPTION only for WILL/WONT/DO/DONT]'
                if c in (DO, DONT, WILL, WONT):
                    self.iacseq += c
                    continue

                self.iacseq = b''
                if c == IAC:
                    buf[self.sb] = buf[self.sb] + c
                else:
                    if c == SB: # SB ... SE start.
                        self.sb = 1
                        self.sbdataq = b''
                    elif c == SE:
                        self.sb = 0
                        self.sbdataq = self.sbdataq + buf[1]
                        buf[1] = b''
                    self.option_callback(self, c, NOOPT)
                    
            elif len(self.iacseq) == 2:
                cmd = self.iacseq[1:2]
                self.iacseq = b''
                opt = c
                if cmd in (DO, DONT, WILL, WONT):
                    self.option_callback(self, cmd, opt)

        self.sbdataq = self.sbdataq + buf[1]


def cb_neg(tn, cmd, opt):
    if cmd == TelnetCmds.SE:
        sb = tn.read_sb_data()
        
        if len(sb) < 1:
            LOG.error("%s: No subnegotiation data.\x1b[0m", tn.name)
        else:
            opt = sb[0:1]

            if opt == TelnetOpts.TTYPE:
                if len(sb) == 2 and sb[1:2] == TelnetSubNeg.SEND:
                    LOG.info("%s sent TTYPE SEND\x1b[0m", tn.name)
                elif sb[1:2] == TelnetSubNeg.IS:
                    LOG.info("%s sent TTYPE IS %s\x1b[0m", tn.name, sb[2:].decode())
                else:
                    LOG.error("%s TTYPE unhandled seq: %s\x1b[0m", tn.name, sb)
            else:
                LOG.info("%s sent IAC SB %s %s IAC SE\x1b[0m", tn.name, TelnetOptName.get(opt, str(ord(opt))), " ".join([str(c) for c in sb[1:]]))
    elif cmd == TelnetCmds.SB:
        pass
    else:
        LOG.info("%s sent %s %s\x1b[0m", tn.name, TelnetCmdName.get(cmd, str(ord(cmd))), TelnetOptName.get(opt, str(ord(opt))))


def main(local_host, local_port, remote_host, remote_port):
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.DEBUG,
        format="%(asctime)s::" + logging.BASIC_FORMAT)

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((local_host, local_port))

    # Listen for incoming connections
    sock.listen()

    sock_cl, client_address = sock.accept()
    LOG.info("new connection from %s", client_address)

    sock_srv = socket.create_connection((remote_host, remote_port))


    tn_cl = TelnetSniffer(
        sock_cl, sock_srv, "\x1b[35mclient", cb_neg)

    tn_srv = TelnetSniffer(
        sock_srv, sock_cl, "\x1b[36mserver", cb_neg)


    t1 = threading.Thread(target=tn_cl.start)
    t1.start()

    t2 = threading.Thread(target=tn_srv.start)
    t2.start()


def _usage():
    print("""
Usage:
    %s <local_host> <local_port> <remote_host> <remote_port>
""".format(sys.argv[0]))

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 4:
        _usage()
        exit(1)

    local_host = sys.argv[1]
    local_port = int(sys.argv[2])
    remote_host = sys.argv[3]
    remote_port = int(sys.argv[4])

    main(local_host, local_port, remote_host, remote_port)
