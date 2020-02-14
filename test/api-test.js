const path = require('path');
const nock = require('nock');
const { expect } = require('chai');
const got = require('got');
const { App, Config } = require('../');

describe('API', () => {
    const app = new App();

    const configInstance = new Config();
    const config = configInstance.config();
    const rootPath = path.join(`http://${config.host}:${config.port}`);
    const usersURL = path.join(rootPath, '/users');

    nock(config.authorizationBaseURL)
        .persist()
        .post(/\/.*\/.*\/.*\/token/)
        .reply(200, {
            'access_token': 'token'
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/groups/)
        .reply(200, {
            value: [
                {
                    id: 'groupId'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/teams\/.*\/channels\?/)
        .reply(200, {
            value: [
                {
                    id: 'channelId'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/teams\/.*\/channels\/.*\/members/)
        .reply(200, {
            value: [
                {
                    userId:      'userId1',
                    displayName: 'username1'
                },
                {
                    userId:      'userId2',
                    displayName: 'username2'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/users\/.*\/presence/)
        .reply(200, {
            availability: 'Available'
        });

    before(async () => {
        await app.createServer();
    });

    after(async () => {
        await app.closeServer();
    });

    it(`Sends a response from the '/users' endpoint`, async () => {
        const expectedStatus = 200;


        const response = await got(usersURL);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Provides a correct response from the '/users' endpoint`, async () => {
        const expectedResponse = [
            { displayName: 'username1', id: 'userId1', status: 'Available' },
            { displayName: 'username2', id: 'userId2', status: 'Available' }
        ];


        const response = await got(usersURL);

        expect(JSON.parse(response.body)).eql(expectedResponse);
    });
});
