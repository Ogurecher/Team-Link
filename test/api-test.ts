import 'mocha';
import path from 'path';
import { expect } from 'chai';
import got from 'got';
import { nockRequests, nockCallRejectionOnce, nockInviteParticipantsOnce, cleanNocks } from './util/nocks';
import { setEnvVariables } from './util/setEnv';

setEnvVariables();

import { App, Config } from '../';

describe('API', () => {
    let app: App;

    const configInstance = new Config();
    const config = configInstance.config();
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

    beforeEach(async () => {
        nockRequests(config);
    });

    afterEach(async () => {
        cleanNocks();
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
        nockInviteParticipantsOnce(config);
        const expectedStatus = 200;


        const response = await got.post(callURL);


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Provides a correct response from the '/call' endpoint`, async () => {
        nockInviteParticipantsOnce(config);
        const expectedResponse = { id: 'callId1' };


        const response = await got.post(callURL);


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
        nockInviteParticipantsOnce(config);
        nockCallRejectionOnce(config);

        const expectedStatus = 202;


        const response = await got.post(addMeURL, {
            json: addMeBody
        });


        expect(response.statusCode).equal(expectedStatus);
    });

    it(`Hangs up a call when calling the bot on the '/addMe' endpoint`, async () => {
        nockInviteParticipantsOnce(config);
        const callRejectionScope = nockCallRejectionOnce(config);


        await got.post(addMeURL, {
            json: addMeBody
        });


        expect(callRejectionScope.isDone()).eql(true);
    });

    it(`/addMe adds user to the previously created call`, async () => {
        nockCallRejectionOnce(config);


        await got.post(callURL);

        const addParticipantsScope = nockInviteParticipantsOnce(config);

        await got.post(addMeURL, {
            json: addMeBody
        });


        expect(addParticipantsScope.isDone()).eql(true);
    });
});
