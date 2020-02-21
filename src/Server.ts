import { once } from 'events';
import path from 'path';
import express from 'express';
import debug from 'debug';
import { router } from './routes/router';

const info = debug('team-link:info');
const error = debug('team-link:error');

export default class Server {
    public host: string;
    public port: string;

    private app: express.Express;
    private staticPath: string;
    private clientPath: string;
    private server: any;

<<<<<<< HEAD
    constructor ({ app, port, host, staticPath, clientPath }: { app: any; port: string; host: string; staticPath: string; clientPath: string }) {
=======
    constructor ({ app, port, host, staticPath }: { app: express.Express; port: string; host: string; staticPath: string }) {
>>>>>>> c3a5cdf... Mostly removed any types (apart from server). Have not created a separate module for interfaces yet
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
            this.server = await this.app.listen(parseInt(this.port, 10), this.host);

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
