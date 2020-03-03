import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken } from './token';
import { HTTPResponse } from '../interfaces';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export async function createCall (req: unknown, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    const accessToken = await getAppAccessToken();

    const createCallQuery = `/communications/calls`;
    const createCallURL = path.join(config.apiBaseURL, createCallQuery);

    const createCallRes = await got.post(createCallURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            callbackUri: 'http://localhost:3000/callback',
            targets:     [
                {
                    identity: {
                        user: {
                            id: 'bccff64b-77fc-404a-a5b8-f208c7a0f1b6'
                        }
                    }
                }
            ],
            requestedModalities: [
                'audio'
            ]
        }
    });

    debug(createCallRes);

    res.send('Ok');
}
