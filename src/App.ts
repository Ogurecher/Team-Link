import express from 'express';
import debug from 'debug';
import Server from './Server';
import Config from './Config';

const configInstance = new Config();
const config = configInstance.config();
const info = debug('team-link:info');
const error = debug('team-link:error');

interface Options {
    port: string;
    host: string;
    staticPath: string;
    clientPath: string;
}

export default class App {
    private app: express.Express;
    private server: Server;
    private options: Options;

    private constructor (options: Options = { port: config.port, host: config.host, staticPath: config.staticPath, clientPath: config.clientPath }) {
        this.app = express();
        this.options = options;
        this.server = new Server({ app: this.app, ...this.options });
    }

    public static async create ({ port = config.port, host = config.host, staticPath = config.staticPath, clientPath = config.clientPath } = {}): Promise<App> {
        const app = new App({ port, host, staticPath, clientPath });

        await app.listen();

        return app;
    }

    public async listen (): Promise<Server> {
        try {
            await this.server.listen();
            info(`Server created, port: ${this.options.port}, host: ${this.options.host}, static path: ${this.options.staticPath}, client path: ${this.options.clientPath}`);
        }
        catch (err) {
            error(err);
            throw err;
        }

        return this.server;
    }

    public async closeServer (): Promise<void> {
        try {
            await this.server.close();
            info('Server closed');
        }
        catch (err) {
            error(err);
            throw err;
        }
    }

    public getHost (): string {
        return this.options.host;
    }

    public getPort (): string {
        return this.options.port;
    }
}
