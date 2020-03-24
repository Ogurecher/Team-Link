import dotenv from 'dotenv';
import { DefaultConfiguration, Configuration } from './interfaces';

export default class Config {
    public defaults: DefaultConfiguration;

    public constructor () {
        dotenv.config();

        this.defaults = {
            port:                 '8080',
            host:                 'localhost',
            staticPath:           'resources',
            clientPath:           'lib/client',
            apiBaseURL:           'https://graph.microsoft.com/beta',
            authorizationBaseURL: 'https://login.microsoftonline.com',
            oauthVersion:         '/oauth2/v2.0',
            callbackURI:          'https://174e52c4.ngrok.io/callback'
        };
    }

    public config (): Configuration {
        return {
            port:                 process.env.PORT || this.defaults.port,
            host:                 process.env.HOST || this.defaults.host,
            staticPath:           process.env.STATIC_PATH || this.defaults.staticPath,
            clientPath:           process.env.CLIENT_PATH || this.defaults.clientPath,
            apiBaseURL:           process.env.API_BASE_URL || this.defaults.apiBaseURL,
            authorizationBaseURL: process.env.OAUTH_BASE_URL || this.defaults.authorizationBaseURL,
            oauthVersion:         process.env.OAUTH_VERSION || this.defaults.oauthVersion,
            callbackURI:          process.env.CALLBACK_URI || this.defaults.callbackURI,
            accessToken:          process.env.OAUTH_ACCESS_TOKEN_USER || '',
            tenantId:             process.env.OAUTH_TENANT_ID || '',
            clientId:             process.env.OAUTH_CLIENT_ID || '',
            clientSecret:         process.env.OAUTH_CLIENT_SECRET || '',
            refreshToken:         process.env.OAUTH_REFRESH_TOKEN_USER || '',
            groupId:              process.env.TEAMS_GROUP_ID || '',
            channelId:            process.env.TEAMS_CHANNEL_ID || ''
        };
    }
}
