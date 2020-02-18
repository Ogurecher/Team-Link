const { once } = require('events');
const path = require('path');
const express = require('express');
const debug = require('debug');
const { router } = require('./routes/router');

const info = debug('team-link:info');
const error = debug('team-link:error');

class Server {
    constructor ({ app, port, host, staticPath }) {
        this.app = app;
        this.host = host;
        this.port = port;
        this.staticPath = path.join(__dirname, staticPath);

        this.app.use(express.static(this.staticPath));

        this.app.use('/', router);
    }

    async listen () {
        try {
            this.server = await this.app.listen(this.port, this.host);

            await once(this.server, 'listening');
            info(`Server listening on port ${this.port}, host: ${this.host}`);
        }
        catch (err) {
            error(err);
            throw err;
        }
    }

    async close () {
        try {
            await this.server.close();
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}

module.exports = Server;
