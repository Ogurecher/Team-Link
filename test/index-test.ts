import 'mocha';
import path from 'path';
import { expect } from 'chai';
import got from 'got';
import { App, Config } from '../';

describe('Server', () => {
    const app = new App();

    const configInstance = new Config();
    const defaults = configInstance.defaults;
    const rootPath = path.join(`http://${configInstance.config().host}:${configInstance.config().port}`);

    before(async () => {
        await app.createServer();
    });

    after(async () => {
        await app.closeServer();
    });

    it(`Sends response from endpoint '/'`, async () => {
        const expectedStatus = 200;


        const response = await got(rootPath);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Sends the correct html`, async () => {
        const expectedTitle = 'Available users';
        const TitleRegex = /<title.*?>([\s\S]*)<\/title>/;


        const response = await got(rootPath);
        const actualTitle = TitleRegex.exec(response.body)[1].trim();


        expect(actualTitle).equal(expectedTitle);
    });

    it('Listens on default host and port if no .env configuration file is provided', () => {
        process.env.PORT = '';
        process.env.HOST = '';


        const defaultConfig = configInstance.config();


        expect({ port: defaultConfig.port, host: defaultConfig.host }).eql({ port: defaults.port, host: defaults.host });
    });

    it('Listens on host and port provided in a .env file', () => {
        process.env.PORT = 'nondefault';
        process.env.HOST = 'nondefault';


        const nonDefaultConfig = configInstance.config();
        const nonDefaultPortHost = { port: nonDefaultConfig.port, host: nonDefaultConfig.host };
        const expectedPortHost = { port: process.env.PORT, host: process.env.HOST };


        expect(nonDefaultPortHost).eql(expectedPortHost);
    });

    it(`Listens on host and port provided in App.listen()`, async () => {
        process.env.PORT = 'nondefault';
        process.env.HOST = 'nondefault';

        const constructorPort = '8000';
        const constructorHost = '127.0.0.1';


        await app.closeServer();

        const constructedServer = await app.createServer({ port: constructorPort, host: constructorHost });
        const address = { port: constructedServer.port, host: constructedServer.host };

        expect(address).eql({ port: constructorPort, host: constructorHost });
    });
});
