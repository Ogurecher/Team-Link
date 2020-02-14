const express = require('express');
const debug = require('debug');
const Server = require('./Server');
const configImport = require('./config');

const config = configImport.config();
const info = debug('team-link:info');
const error = debug('team-link:error');

class App {
    constructor () {
        this.app = express();
    }

    async createServer ({ port = config.port, host = config.host, staticPath = config.staticPath } = {}) {
        try {
            this.server = new Server(this.app, port, host, staticPath);
            await this.server.listen();
            info(`Server created, port: ${port}, host: ${host}, static path: ${staticPath}`);
        }
        catch (err) {
            error(err);
            throw err;
        }

        return this.server;
    }

    async closeServer () {
        try {
            await this.server.close();
            info('Server closed');
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}

module.exports = App;
