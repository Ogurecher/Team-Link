import 'mocha';
import path from 'path';
import nock from 'nock';
import { expect } from 'chai';
import got from 'got';
import { App, Config } from '../';

describe('API', () => {
    let app = new App();

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
        .post(/\/communications\/getPresencesByUserId/)
        .reply(200, {
            value: [
                {
                    id:           'userId1',
                    availability: 'Available'
                },
                {
                    id:           'userId2',
                    availability: 'Offline'
                }
            ]
        });

    before(async () => {
        app = await App.create();
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
            { displayName: 'username1', id: 'userId1', status: 'Available' }
        ];


        const response = await got(usersURL);

        expect(JSON.parse(response.body)).eql(expectedResponse);
    });
});
