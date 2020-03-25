import 'mocha';
import path from 'path';
import { expect } from 'chai';
import got from 'got';
import { setEnvVariables } from './util/setEnv';

setEnvVariables();

import { App, Config } from '../';
import { NockManager } from './util/NockManager';

describe('API', () => {
    let app: App;

    const configInstance = new Config();
    const config = configInstance.config();

    const nockManager = new NockManager(config);

    const rootPath = path.join(`http://${config.host}:${config.port}`);
    const usersURL = path.join(rootPath, '/users');
    const callURL = path.join(rootPath, '/call');
    const addMeURL = path.join(rootPath, '/addMe');

    before(async () => {
        app = await App.create();
    });

    after(async () => {
        await app.closeServer();
    });

    afterEach(async () => {
        nockManager.cleanNocks();
    });

    it(`Sends a response from the '/users' endpoint`, async () => {
        nockManager.setupAllNocks();

        const expectedStatus = 200;


        const response = await got(usersURL);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Provides a correct response from the '/users' endpoint`, async () => {
        nockManager.setupAllNocks();

        const expectedResponse = [
            { displayName: 'username1', id: 'userId1', status: 'Available' }
        ];


        const response = await got(usersURL);


        expect(JSON.parse(response.body)).eql(expectedResponse);
    });

    const addMeBody = {
        value: [
            {
                changeType:   'created',
                resourceUrl:  '/communications/calls/callId',
                resourceData: {
                    source: {
                        identity: {
                            user: {
                                id: 'userId'
                            }
                        }
                    }
                }
            }
        ]
    };

    it(`Sends a response from the '/addMe' endpoint`, async () => {
        nockManager.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        });

        nockManager.setupNock({
            method:   'post',
            name:     'rejectCallNocks',
            response: {
                status: 202
            }
        });

        nockManager.setupAllNocks();

        const expectedStatus = 202;


        const response = await got.post(addMeURL, {
            json: addMeBody
        });


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Hangs up a call when calling the bot on the '/addMe' endpoint`, async () => {
        nockManager.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        });

        const callRejectionScope = nockManager.setupNock({
            method:   'post',
            name:     'rejectCallNocks',
            response: {
                status: 202
            }
        })[0];

        nockManager.setupAllNocks();


        await got.post(addMeURL, {
            json: addMeBody
        });


        expect(callRejectionScope.isDone()).eql(true);
    });

    it(`/addMe adds user to the previously created call`, async () => {
        const addParticipantsScope = nockManager.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        })[0];

        nockManager.setupAllNocks();

        await got.post(callURL);

        await got.post(addMeURL, {
            json: addMeBody
        });


        expect(addParticipantsScope.isDone()).eql(true);
    });

    it(`Sends a response from the '/call' endpoint`, async () => {
        nockManager.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        });

        nockManager.setupAllNocks();

        const expectedStatus = 200;


        const response = await got.post(callURL);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Provides a correct response from the '/call' endpoint`, async () => {
        nockManager.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        });

        nockManager.setupAllNocks();

        const expectedResponse = { id: 'callId1' };


        const response = await got.post(callURL);


        expect(JSON.parse(response.body)).eql(expectedResponse);
    });
});
