import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { AddMeRequest, HTTPResponse } from '../interfaces';
import { callIdEmitter } from './call';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken } from './token';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export async function addMe (req: AddMeRequest, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    if (req.body.value[0].changeType === 'created') {
        const userId = req.body.value[0].resourceData.source.identity.user.id;
        const accessToken = await getAppAccessToken();

        callIdEmitter.once('CallId provided', async callId => {
            debug(`Adding ${userId} to ${callId}`);

            const addParticipantsQuery = `/communications/calls/${callId}/participants/invite`;
            const addParticipantsURL = path.join(config.apiBaseURL, addParticipantsQuery);

            await got.post(addParticipantsURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                json: {
                    'participants': [
                        {
                            '@odata.type': '#microsoft.graph.invitationParticipantInfo',
                            'identity':    {
                                '@odata.type': '#microsoft.graph.identitySet',
                                'user':        {
                                    '@odata.type': '#microsoft.graph.identity',
                                    'id':          `${userId}`,
                                    'tenant':      `${config.tenantId}`
                                }
                            }
                        }
                    ],
                    'clientContext': config.clientId
                }
            });
        });

        const rejectCallQuery = `${req.body.value[0].resourceUrl}/reject`;
        const rejectCallURL = path.join(config.apiBaseURL, rejectCallQuery);

        await got.post(rejectCallURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            json: {
                'reason': 'None'
            }
        });

        callIdEmitter.emit('CallId requested');
    }

    res.sendStatus(202);
}
