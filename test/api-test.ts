import 'mocha';
import path from 'path';
import { expect } from 'chai';
import got from 'got';
import { App, Config } from '../';
import { nockRequests } from './util/nocks';

describe('API', () => {
    let app: App;

    const configInstance = new Config();
    const config = configInstance.config();
    const rootPath = path.join(`http://${config.host}:${config.port}`);
    const usersURL = path.join(rootPath, '/users');
    const callURL = path.join(rootPath, '/call');

    nockRequests(config);

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

    it(`Sends a response from the '/call' endpoint`, async () => {
        const expectedStatus = 200;


        const response = await got.post(callURL);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Provides a correct response from the '/call' endpoint`, async () => {
        const expectedResponse = { id: 'callId1' };


        const response = await got.post(callURL);


        expect(JSON.parse(response.body)).eql(expectedResponse);
    });
});
