import { Selector } from 'testcafe';
import { setEnvVariables } from '../util/setEnv';

setEnvVariables();

import { App, Config } from '../../';
import { NockManager } from '../util/NockManager';

const configInstance = new Config();
const config = configInstance.config();

const rootPath = `http://${config.host}:${config.port}`;

let app: App;

const nockManager = new NockManager(config);

fixture `Client`
    .page `${rootPath}`
    .before(async () => {
        app = await App.create({ port: config.port, host: config.host });
    })
    .after(async () => {
        await app.closeServer();
    })
    .afterEach(async () => {
        nockManager.cleanNocks();
    });

test('Polls repeatedly', async t => {
    nockManager.setupAllNocks();

    nockManager.setupNock({
        method:   'post',
        name:     'getPresencesNocks',
        response: {
            status: 200,
            body:   {
                value: [
                    {
                        id:           'userId1',
                        availability: 'Available'
                    },
                    {
                        id:           'userId2',
                        availability: 'Available'
                    }
                ]
            }
        }
    });

    nockManager.setupAllNocks();

    const expectedInitialUsersTable = 'Display Name ID Status \n username1 userId1 Available'.replace(/\s/g, '');


    const initialUsersTable = await Selector('#available_users').textContent;


    await t
        .expect(initialUsersTable.replace(/\s/g, '')).eql(expectedInitialUsersTable)
        .expect(Selector('#available_users').textContent).notEql(initialUsersTable, { timeout: 10000 });
});

test('Calls when the "call" button is clicked', async t => {
    nockManager.setupAllNocks();

    nockManager.setupNock({
        method:   'post',
        name:     'getPresencesNocks',
        response: {
            status: 200,
            body:   {
                value: [
                    {
                        id:           'userId1',
                        availability: 'Available'
                    },
                    {
                        id:           'userId2',
                        availability: 'Available'
                    }
                ]
            }
        }
    });

    const expectedCallInfo = 'callId: callId1';

    await t
        .expect(Selector('#available_users').textContent).ok()
        .click('#call_button')
        .expect(Selector('#call_info').textContent).eql(expectedCallInfo);
});
