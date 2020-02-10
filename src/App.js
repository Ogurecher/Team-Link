const { once } = require('events');
const path = require('path');
const express = require('express');
const config = require('./config.js').config();
const debug = require('debug');

const info = debug('info');
const error = debug('error');

class App {
    constructor({ staticPath = config.staticPath } = {}) {
        this.app = express();
        this.staticPath = path.join(__dirname, staticPath);

        this.app.use(express.static(this.staticPath));
    }

    async listen ({ port = config.port, host = config.host } = {}) {
        let server;

        try {
            server = this.app.listen(port, host);

            await once(server, 'listening');
            info(`Listening on port ${port}`);
        }
        catch (err) {
            error(err);
            throw err;
        }
        
        return server;
    }
}

module.exports.App = App;