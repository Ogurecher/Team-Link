import { App, Config } from '../../';

const configInstance = new Config();
const config = configInstance.config();

const rootPath = `http://${config.host}:${config.port}`;

let app: App;

fixture `Client`
    .page `${rootPath}`
    .before(async () => {
        app = await App.create({ port: config.port, host: config.host });
    })
    .after(async () => {
        await app.closeServer();
    });

test('Polls repeatedly', async t => {
    await t
        .expect(true).eql(true);
});
