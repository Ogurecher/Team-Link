const path = require('path');
const { App, config } = require('../');
const { expect } = require('chai');
const got = require('got');

describe('Server', () => {
    const myApp = new App();
    const defaults = config.defaults;
    const rootPath = path.join(`http://${config.config().host}:${config.config().port}`);

    let server;

    before(async () => {
        server = await myApp.listen();
    });

    after(async () => {
        await server.close();
    });

    it(`Sends response from endpoint '/'`, async () => {
        const expectedStatus = 200;


        const response = await got(rootPath);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Sends the correct html`, async () => {
        const expectedBody = 'Hello Node.js';
        const bodyRegex = /<body.*?>([\s\S]*)<\/body>/;


        const response = await got(rootPath);
        const actualBody = bodyRegex.exec(response.body)[1].trim();


        expect(actualBody).equal(expectedBody);
    });

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


        await server.close();

        const constructedServer = await myApp.listen({ port: constructorPort, host: constructorHost });
        const address = await constructedServer.address();

        await constructedServer.close();


        expect({ port: address.port.toString(), host: address.address })
            .eql({ port: constructorPort, host: constructorHost });
    });
});
