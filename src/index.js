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

    listen (port = config.port, host = config.host) {
        return new Promise((resolve, reject) => {
            this.server = app.listen(portNum, () => {
                info(`Listening on port ${portNum}`);
                resolve();
            }).once('error', err => {
                error(err);
                reject();
            });
        });
    }

    close () {
        return new Promise((resolve, reject) => {
            this.server = this.server.close(() => resolve()).once('error', err => {
                error(err);
                reject();
            });
        });
    }
}

if (require.main === module) {
    const server = new MyServer();

    server.listen();
}

exports.MyServer = MyServer;
