import { once } from 'events';
import path from 'path';
import express from 'express';
import debug from 'debug';
import { router } from './routes/router';

const info = debug('team-link:info');
const error = debug('team-link:error');

export default class Server {
    private app: any;
    private host: string;
    private port: string;
    private staticPath: string;
    private clientPath: string;
    private server: any;

    constructor ({ app, port, host, staticPath, clientPath }: { app: any; port: string; host: string; staticPath: string; clientPath: string }) {
        this.app = app;
        this.host = host;
        this.port = port;
        this.staticPath = path.resolve(staticPath);
        this.clientPath = path.resolve(clientPath);

        this.app.use('/', express.static(this.staticPath));
        this.app.use('/', express.static(this.clientPath));

        this.app.use('/', router);
    }

    async listen (): Promise<void> {
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

    async close (): Promise<void> {
        try {
            await this.server.close();
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}
