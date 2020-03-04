import { once } from 'events';
import path from 'path';
import express from 'express';
import debug from 'debug';
import { router } from './routes/router';
import { ExpressServer } from './interfaces';

const info = debug('team-link:info');
const error = debug('team-link:error');

export default class Server {
    public host: string;
    public port: string;

    private app: express.Express;
    private staticPath: string;
    private clientPath: string;
    private server?: ExpressServer;

    public constructor ({ app, port, host, staticPath, clientPath }: { app: express.Express; port: string; host: string; staticPath: string; clientPath: string }) {
        this.app = app;
        this.host = host;
        this.port = port;
        this.staticPath = path.resolve(staticPath);
        this.clientPath = path.resolve(clientPath);

        this.app.use(express.json());

        this.app.use('/', express.static(this.staticPath));
        this.app.use('/', express.static(this.clientPath));

        this.app.use('/', router);
    }

    public async listen (): Promise<void> {
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

    public async close (): Promise<void> {
        try {
            await this.server?.close();
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}
