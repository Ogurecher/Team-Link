import path from 'path';
import got from 'got';
import Config from '../Config';

const configInstance = new Config();
const config = configInstance.config();

export async function refreshAccessToken (): Promise<string> {
    const refreshURL = path.join(config.authorizationBaseURL, config.tenantId, config.oauthVersion, '/token');

    const response = await got.post(refreshURL, {
        body: `
        client_id=${config.clientId}
        &grant_type=refresh_token
        &scope=https://graph.microsoft.com/.default
        &client_secret=${config.clientSecret}
        &refresh_token=${config.refreshToken}
        `
    });

    return JSON.parse(response.body).access_token;
}

export async function getAppAccessToken (): Promise<string> {
    const accessTokenURL = path.join(config.authorizationBaseURL, config.tenantId, config.oauthVersion, '/token');

    const response = await got.post(accessTokenURL, {
        body: `
        client_id=${config.clientId}
        &grant_type=client_credentials
        &scope=https://graph.microsoft.com/.default
        &client_secret=${config.clientSecret}
        `
    });

    return JSON.parse(response.body).access_token;
}
