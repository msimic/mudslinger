import axios from 'axios';

export namespace clientInfo {
    export let sid: string = null;
    export let clientIp: string = null;
    export let telnetHost: string = null;
    export let telnetPort: number = null;
}

let axinst = axios.create({
    validateStatus: (status) => {
        return status === 200;
    }
});

export async function apiGetClientConfig() {
    return axinst.get('/client/client_config');
}

export async function apiGetProfile(profileId: string) {
    return axinst.get('/user/get_profile', {
        params: {
            id: profileId
        }
    });
}

export async function apiPostProfileConfig(profileId: string, val: string) {
    return axinst.post('/user/save_profile_config', {
        id: profileId,
        config: val
    });
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
    return axinst.post('/client/contact', {
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