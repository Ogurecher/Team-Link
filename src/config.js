require('dotenv').config();

const port = '8080';
const host = '';

const config = () => {
    return {
        port: port? port : process.env.PORT,
        host: host? host : process.env.HOST
    }
}

exports.config = config;
