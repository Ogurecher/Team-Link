const { once } = require('events');
const path = require('path');
const express = require('express');
const config = require('./config.js').config();
const debug = require('debug');

const info = debug('info');
const error = debug('error');

class MyServer {

    constructor( port = config.port, host = config.host) {
        this.app = express();
        this.staticPath = path.join(__dirname, '../resources/html');

        this.port = port;
        this.host = host;

        this.app.use(express.static(this.staticPath));
    }

    async listen () {
        try {
            this.server = this.app.listen(this.port, this.host);
            await once(this.server, 'listening');
            info(`Listening on port ${this.port}`);
        }
        catch (err) {
            error(err);
            throw err;
        }
    }

    async close () {
        try {
            await once(this.server.close(), 'close');
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}

module.exports.MyServer = MyServer;
