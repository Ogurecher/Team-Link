const dotenv = require('dotenv');

const port = '8080';
const host = 'localhost';
const staticPath = '../resources';
const accessToken = '';
const apiBaseURL = 'https://graph.microsoft.com/beta';

dotenv.config();

const config = () => {
    return {
        port:        process.env.PORT ? process.env.PORT : port,
        host:        process.env.HOST ? process.env.HOST : host,
        staticPath:  process.env.STATIC_PATH ? process.env.STATIC_PATH : staticPath,
        accessToken: process.env.OAUTH_ACCESS_TOKEN_USER ? process.env.OAUTH_ACCESS_TOKEN_USER : accessToken,
        apiBaseURL:  process.env.API_BASE_URL ? process.env.API_BASE_URL : apiBaseURL
    };
};

module.exports = {
    config,
    defaults: {
        port,
        host,
        staticPath,
        accessToken,
        apiBaseURL
    }
};
