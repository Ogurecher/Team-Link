const { once } = require('events');
const path = require('path');
const express = require('express');
const debug = require('debug');
const configImport = require('./config.js');

const config = configImport.config();
const info = debug('team-link: info');
const error = debug('team-link: error');

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

module.exports = App;