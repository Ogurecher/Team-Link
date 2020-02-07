const path = require('path');
const app = require('../src/index.js');
const { expect } = require('chai');
const got = require('got');
const configImport = require('../src/config.js');

describe('Server', () => {
    const myServer = new app.MyServer();
    const config = configImport.config();
    const defaults = configImport.defaults;
    const rootPath = path.join(`http://${config.host}:${config.port}`);

    before(() => {
        myServer.listen(config.port, config.host);
    });

    after(() => {
        myServer.close();
    });

    it('Listens on default host and port if no .env configuration file is provided', () => {
        process.env.PORT = '';
        process.env.HOST = '';

        const defaultConfig = configImport.config();

        expect(defaultConfig).eql(defaults);
    });

    it('Listens on host and port provided in a .env file', () => {
        process.env.PORT = 'nondefault';
        process.env.HOST = 'nondefault';

        const nonDefaultConfig = configImport.config();
        const expectedConfig = { port: process.env.PORT, host: process.env.HOST };

        expect(nonDefaultConfig).eql(expectedConfig);
    });

    it(`Sends response from endpoint '/'`, async () => {
        const expectedStatus = 200;

        const response = await got(rootPath);

        expect(response.statusCode).equal(expectedStatus);
    });

    it('Sends the correct html', async () => {
        const expectedBody = 'Hello Node.js';
        const bodyRegex = /<body.*?>([\s\S]*)<\/body>/;

        const response = await got(rootPath);
        const actualBody = bodyRegex.exec(response.body)[1].trim();

        expect(actualBody).equal(expectedBody);
    });
});
