const path = require('path');
const app = require('../src/index.js');
const { expect } = require('chai');
const got = require('got');

describe('Server', () => {
    const myServer = new app.MyServer();
    const host = 'localhost';
    const port = '3000';
    const rootPath = path.join(`http://${host}:${port}`);

    before(() => {
        myServer.listen(port, host);
    });

    after(() => {
        myServer.close();
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
});
