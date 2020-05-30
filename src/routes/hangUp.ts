import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { callIdEmitter } from './call';
import { HTTPResponse } from '../interfaces';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export async function hangUp (req: unknown, res: HTTPResponse): Promise<void> {
    callIdEmitter.once('CallId provided', async (callId, accessToken) => {
        const hangUpQuery = `/communications/calls/${callId}`;
        const hangUpURL = path.join(config.apiBaseURL, hangUpQuery);

        await got.delete(hangUpURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        debug(`Hang up callId: ${callId}`);
    });

    callIdEmitter.emit('CallId requested');

    res.sendStatus(204);
}
