import path from 'path';
import got from 'got';
import Config from '../Config';

const configInstance = new Config();
const config = configInstance.config();

export async function refreshAccessToken () {
    const refreshURL = path.join(config.authorizationBaseURL, config.tenantId, config.oauthVersion, '/token');

    const response = await got.post(refreshURL, {
        body: `
        client_id=${config.clientId}
        &grant_type=refresh_token
        &scope=offline_access+user.read.all+mail.read+chat.readwrite+presence.read.all+group.read.all
        &client_secret=${config.clientSecret}
        &refresh_token=${config.refreshToken}
        `
    });

    return JSON.parse(response.body).access_token;
}
