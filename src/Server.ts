import { once } from 'events';
import path from 'path';
import express from 'express';
import debug from 'debug';
import { router } from './routes/router';

const info = debug('team-link:info');
const error = debug('team-link:error');

export default class Server {
    app
    host
    port
    staticPath
    clientPath
    server

    constructor ({ app, port, host, staticPath, clientPath }) {
        this.app = app;
        this.host = host;
        this.port = port;
        this.staticPath = path.resolve(staticPath);
        this.clientPath = path.resolve(clientPath);

        this.app.use('/', express.static(this.staticPath));
        this.app.use('/', express.static(this.clientPath));
        console.log(this.clientPath);

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
