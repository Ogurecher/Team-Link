const { once } = require('events');
const path = require('path');
const express = require('express');
const config = require('./config.js').config();
const debug = require('debug');

const info = debug('info');
const error = debug('error');

const app = express();

const staticPath = path.join(__dirname, '../resources/html');

app.use(express.static(staticPath));

class MyServer {

    async listen (port = config.port, host = config.host) {
        try {
            this.server = await app.listen(port, host);
            await once(this.server, 'listening');
            info(`Listening on port ${port}`);
        }
        catch (err) {
            error(err);
        }
    }

    async close () {
        try {
            await once(this.server.close(), 'close');
        }
        catch (err) {
            error(err);
        }
    }
}

if (require.main === module) {
    const server = new MyServer();

    server.listen();
}

exports.MyServer = MyServer;
