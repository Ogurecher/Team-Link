const dotenv = require('dotenv');

class Config {
    constructor () {
        dotenv.config();

        this.defaults = {
            port:                 '8080',
            host:                 'localhost',
            staticPath:           '../resources',
            apiBaseURL:           'https://graph.microsoft.com/beta',
            authorizationBaseURL: 'https://login.microsoftonline.com',
            oauthVersion:         '/oauth2/v2.0'
        };
    }

    config () {
        return {
            port:                 process.env.PORT || this.defaults.port,
            host:                 process.env.HOST || this.defaults.host,
            staticPath:           process.env.STATIC_PATH || this.defaults.staticPath,
            apiBaseURL:           process.env.API_BASE_URL || this.defaults.apiBaseURL,
            authorizationBaseURL: process.env.OAUTH_BASE_URL || this.defaults.authorizationBaseURL,
            oauthVersion:         process.env.OAUTH_VERSION || this.defaults.oauthVersion,
            accessToken:          process.env.OAUTH_ACCESS_TOKEN_USER || 'not provided',
            tenantId:             process.env.OAUTH_TENANT_ID || 'not provided',
            clientId:             process.env.OAUTH_CLIENT_ID || 'not provided',
            clientSecret:         process.env.OAUTH_CLIENT_SECRET || 'not provided',
            refreshToken:         process.env.OAUTH_REFRESH_TOKEN_USER || 'not provided'
        };
    }
}

module.exports = Config;
