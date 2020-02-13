const path = require('path');
const { App, config } = require('../');
const { expect } = require('chai');
const got = require('got');

describe('Server', () => {
    const myApp = new App();
    const defaults = config.defaults;
    const rootPath = path.join(`http://${config.config().host}:${config.config().port}`);

    before(async () => {
        await myApp.createServer();
    });

    after(async () => {
        await myApp.closeServer();
    });

    it(`Sends response from endpoint '/'`, async () => {
        const expectedStatus = 200;


        const response = await got(rootPath);


        expect(response.statusCode).equal(expectedStatus);
    });

    /*it(`Sends the correct html`, async () => {
        const expectedBody = 'Hello Node.js';
        const bodyRegex = /<body.*?>([\s\S]*)<\/body>/;


        const response = await got(rootPath);
        const actualBody = bodyRegex.exec(response.body)[1].trim();


        expect(actualBody).equal(expectedBody);
    });*/

    it('Listens on default host and port if no .env configuration file is provided', () => {
        process.env.PORT = '';
        process.env.HOST = '';


        const defaultConfig = config.config();


        expect(defaultConfig).eql(defaults);
    });

    it('Listens on host and port provided in a .env file', () => {
        process.env.PORT = 'nondefault';
        process.env.HOST = 'nondefault';


        const nonDefaultConfig = config.config();
        const nonDefaultPortHost = { port: nonDefaultConfig.port, host: nonDefaultConfig.host };
        const expectedPortHost = { port: process.env.PORT, host: process.env.HOST };


        expect(nonDefaultPortHost).eql(expectedPortHost);
    });

    it(`Listens on host and port provided in App.listen()`, async () => {
        process.env.PORT = 'nondefault';
        process.env.HOST = 'nondefault';

        const constructorPort = '8000';
        const constructorHost = '127.0.0.1';


        await myApp.closeServer();

        const constructedServer = await myApp.createServer({ port: constructorPort, host: constructorHost });
        const address = { port: constructedServer.port, host: constructedServer.host };

        expect(address).eql({ port: constructorPort, host: constructorHost });
    });
});
