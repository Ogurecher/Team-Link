import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken } from './token';
import { HTTPResponse, CreateCallRequest } from '../interfaces';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export async function createCall (req: CreateCallRequest, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    const accessToken = await getAppAccessToken();

    const createCallQuery = `/communications/calls`;
    const createCallURL = path.join(config.apiBaseURL, createCallQuery);

    const createCallRes = await got.post(createCallURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            '@odata.type': '#microsoft.graph.call',
            'callbackUri': `${config.callbackURI}`,
            'targets':     [
                {
                    '@odata.type': '#microsoft.graph.invitationParticipantInfo',
                    'identity':    {
                        '@odata.type': '#microsoft.graph.identitySet',
                        'user':        {
                            '@odata.type': '#microsoft.graph.identity',
                            'id':          `${req.body.userId[0]}`
                        }
                    }
                }
            ],
            'requestedModalities': [
                'video'
            ],
            'tenantId':    `${config.tenantId}`,
            'mediaConfig': {
                '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
            }
        }
    });

    const callParameters = JSON.parse(createCallRes.body);

    debug(callParameters);

    res.send(callParameters);
}
