const path = require('path');
const app = require('../src/index.js');
const { expect } = require('chai');
const got = require('got');

require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

describe('Server', () => {
    const myServer = new app.MyServer();
    const rootPath = path.join(`http://${process.env.TEST_HOST}:${process.env.TEST_PORT}`);

    before(() => {
        myServer.listen(process.env.TEST_PORT, process.env.TEST_HOST);
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
