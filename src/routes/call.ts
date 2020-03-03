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
            '@odata.type':             '#microsoft.graph.call',
            'direction':               'outgoing',
            'ringingTimeoutInSeconds': '10',
            'callbackUri':             `${config.callbackURI}`,
            'targets':                 populateUsers(req.body.userIds),
            'source':                  {
                '@odata.type': '#microsoft.graph.participantInfo',
                'identity':    {
                    '@odata.type': '#microsoft.graph.identitySet',
                    'application': {
                        '@odata.type': '#microsoft.graph.identity',
                        'displayName': 'Team-Link Bot',
                        'id':          '37b604eb-dbb8-495c-9638-884b3b9c5d72'
                    }
                }
            },
            "requestedModalities": [
                "video"
            ],
            'tenantId':    `${config.tenantId}`,
            'mediaConfig': {
                '@odata.type':                 '#microsoft.graph.serviceHostedMediaConfig',
                'removeFromDefaultAudioGroup': false
            }
        }
    });

    const callParameters = JSON.parse(createCallRes.body);

    debug(callParameters);

    res.send(callParameters);
}

function populateUsers (userIds: string[]): {}[] {
    const template = (userId: string): {} => {
        return {
            '@odata.type': '#microsoft.graph.invitationParticipantInfo',
            'identity':    {
                '@odata.type': '#microsoft.graph.identitySet',
                'user':        {
                    '@odata.type': '#microsoft.graph.identity',
                    'id':          `${userId}`
                }
            }
        };
    };

    return userIds.map((userId: string) => template(userId));
}
