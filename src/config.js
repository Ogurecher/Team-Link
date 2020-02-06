require('dotenv').config();

const port = '8080';
const host = 'localhost';

const config = () => {
    return {
        port: process.env.PORT? process.env.PORT : port,
        host: process.env.HOST? process.env.HOST : host
    }
}

exports.config = config;
exports.defaults = {port, host};
