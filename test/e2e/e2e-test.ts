import { Selector } from 'testcafe';
import nock from 'nock';
import { App, Config } from '../../';
import { nockRequests } from '../util/nocks';

const configInstance = new Config();
const config = configInstance.config();

const rootPath = `http://${config.host}:${config.port}`;

let app: App;

const userPresences = nockRequests(config);

fixture `Client`
    .page `${rootPath}`
    .before(async () => {
        app = await App.create({ port: config.port, host: config.host });
    })
    .after(async () => {
        await app.closeServer();
    });

test('Polls repeatedly', async t => {
    await userPresences.persist(false);

    const usersTable = await Selector('#available_users').textContent;

    nock(config.apiBaseURL)
        .post(/\/communications\/getPresencesByUserId/)
        .reply(200, {
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
        });

    await t
        .expect(Selector('#available_users').textContent).notEql(usersTable, { timeout: 10000 });
});
