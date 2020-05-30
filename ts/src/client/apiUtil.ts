import axios from 'axios';

declare let configClient: any;

export namespace clientInfo {
    export let sid: string = null;
    export let clientIp: string = null;
    export let telnetHost: string = null;
    export let telnetPort: number = null;
}

let axinst = axios.create({
    baseURL: location.protocol + "//" +
        configClient.apiHost +
        ":" +
        (configClient.apiPort || location.port),
    validateStatus: (status) => {
        return status === 200;
    }
});

export function apiPostUserConfig(cfgVals: string) {
    return axinst.post('/usage/user_config', {
        sid: clientInfo.sid,
        vals: cfgVals,
        time_stamp: new Date()
    });
}

export function apiPostMxpSend() {
    return axinst.post('/usage/mxp_send', {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export function apiPostClientConn() {
    return axinst.post('/usage/client_conn', {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export function apiPostContact(message: string, email: string) {
    return axinst.post('/usage/contact', {
        "message": message,
        "email": email,
        "client_info": {
            sid: clientInfo.sid,
            from_addr: clientInfo.clientIp,
            to_addr: clientInfo.telnetHost,
            to_port: clientInfo.telnetPort
        }
    });
}

export namespace TestFixture {
    export function GetAxios() { return axinst; }
}