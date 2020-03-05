import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken, refreshAccessToken } from './token';
import { HTTPResponse, CreateCallRequest, MeetingInfo } from '../interfaces';

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
            'ringingTimeoutInSeconds': '60',
            'callbackUri':             `${config.callbackURI}`,
            'targets':                 populateUsers(req.body.userIds),
            'requestedModalities':     [
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

    /*
    const meetingInfo = await createOnlineMeeting();
    const callId = await callMeeting(meetingInfo);
    await addParticipants({ callId, userIds: req.body.userIds, accessToken });
    */
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

async function createOnlineMeeting (): Promise<MeetingInfo> {
    const accessToken = await refreshAccessToken();

    const createMeetingQuery = `/me/onlineMeetings`;
    const createMeetingURL = path.join(config.apiBaseURL, createMeetingQuery);

    const createMeetingRes = await got.post(createMeetingURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {}
    });

    const onlineMeeting = JSON.parse(createMeetingRes.body);

    const organizerId = onlineMeeting.participants.organizer.identity.user.id;
    const chatInfo = onlineMeeting.chatInfo;

    return {
        organizerId,
        chatInfo
    };
}

async function callMeeting ({ organizerId, chatInfo }: MeetingInfo): Promise<string> {
    const organizerMeetingInfo = {
        organizer: populateUsers([organizerId])[0]
    };

    const accessToken = await getAppAccessToken();

    const callMeetingQuery = `/communications/calls`;
    const callMeetingURL = path.join(config.apiBaseURL, callMeetingQuery);

    const callMeetingRes = await got.post(callMeetingURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            '@odata.type': '#microsoft.graph.call',
            'callbackUri': `${config.callbackURI}`,
            'chatInfo':    chatInfo,
            'meetingInfo': organizerMeetingInfo,
            'tenantId':    `${config.tenantId}`,
            'mediaConfig': {
                '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
            }
        }
    });

    const callParameters = JSON.parse(callMeetingRes.body);

    debug(callParameters);

    return callParameters.id;
}

async function addParticipants ({ callId, userIds, accessToken }: { callId: string; userIds: string[]; accessToken: string}): Promise<void> {
    const callMeetingQuery = `/communications/calls/${callId}/participants/invite`;
    const callMeetingURL = path.join(config.apiBaseURL, callMeetingQuery);

    const callMeetingRes = await got.post(callMeetingURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            'participants':  populateUsers(userIds),
            'clientContext': config.clientId
        }
    });
}
