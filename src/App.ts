import express from 'express';
import debug from 'debug';
import Server from './Server';
import Config from './Config';

const configInstance = new Config();
const config = configInstance.config();
const info = debug('team-link:info');
const error = debug('team-link:error');

export default class App {
    private app: express.Express;
    private port: string;
    private host: string;
    private staticPath: string;
    private clientPath: string;
    private server: Server;

    constructor ({ port = config.port, host = config.host, staticPath = config.staticPath, clientPath = config.clientPath } = {}) {
        this.app = express();
        this.port = port;
        this.host = host;
        this.staticPath = staticPath;
        this.clientPath = clientPath;
        this.server = new Server({ app: this.app, port, host, staticPath, clientPath });
    }

    static async create ({ port = config.port, host = config.host, staticPath = config.staticPath, clientPath = config.clientPath } = {}): Promise<App> {
        const app = new App({ port, host, staticPath, clientPath });

        await app.listen();

        return app;
    }

    async listen (): Promise<Server> {
        try {
            await this.server.listen();
            info(`Server created, port: ${this.port}, host: ${this.host}, static path: ${this.staticPath}, client path: ${this.clientPath}`);
        }
        catch (err) {
            error(err);
            throw err;
        }

        return this.server;
    }

    async closeServer (): Promise<void> {
        try {
            await this.server.close();
            info('Server closed');
        }
        catch (err) {
            error(err);
            throw err;
        }
    }

    getHost (): string {
        return this.host;
    }

    getPort (): string {
        return this.port;
    }
}
