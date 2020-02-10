require('dotenv').config();

const port = '8080';
const host = 'localhost';
const staticPath = '../resources/html'

const config = () => {
    return {
        port: process.env.PORT? process.env.PORT : port,
        host: process.env.HOST? process.env.HOST : host,
        staticPath: process.env.STATIC_PATH? process.env.STATIC_PATH : staticPath
    }
}

exports.config = config;
exports.defaults = {port, host, staticPath};
