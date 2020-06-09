import axios from 'axios';

export namespace clientInfo {
    export let sid: string = null;
    export let clientIp: string = null;
    export let telnetHost: string = null;
    export let telnetPort: number = null;
}

let axinst = axios.create({
    baseURL: location.protocol + "//" +
        'api.' + document.domain +
        ":" + location.port,
    validateStatus: (status) => {
        return status === 200;
    }
});

export async function apiGetClientConfig() {
    return axinst.get('/usage/client_config');
}

export async function apiPostUserConfig(cfgVals: string) {
    return axinst.post('/usage/user_config', {
        sid: clientInfo.sid,
        vals: cfgVals,
        time_stamp: new Date()
    });
}

export async function apiPostMxpSend() {
    return axinst.post('/usage/mxp_send', {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export async function apiPostClientConn() {
    return axinst.post('/usage/client_conn', {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export async function apiPostContact(message: string, email: string) {
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

export async function apiGetProfileConfig(profileId: string) {
    return axinst.get('/profile/config', {
        params: {
            id: profileId
        }
    });
}

export async function apiPostProfileConfig(profileId: string | null, config: any) {
    return axinst.post('/profile/config', {
        profile_id: profileId,
        config: config
    });
}

export namespace TestFixture {
    export function GetAxios() { return axinst; }
}