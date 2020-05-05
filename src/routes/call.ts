import got from 'got';
import path from 'path';
import events from 'events';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken, refreshAccessToken } from './token';
import { HTTPResponse, CreateCallRequest, MeetingInfo, Call, UserInfo, OrganizerMeetingInfo } from '../interfaces';
import { notifier } from './callback';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export const callIdEmitter = new events.EventEmitter();

export async function createCall (req: CreateCallRequest, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    const accessToken = await getAppAccessToken();

    const meetingInfo = await createOnlineMeeting();
    const callParameters = await callMeeting(meetingInfo);
    const callId = callParameters.id;

    notifier.once('Call established', () => {
        addParticipants({ callId, userIds: req.body.userIds, accessToken });
    });

    const callIdRequestedCallback = (): void => {
        callIdEmitter.emit('CallId provided', callId, accessToken);
    };

    callIdEmitter.on('CallId requested', callIdRequestedCallback);

    notifier.once('Call terminated', () => {
        callIdEmitter.removeListener('CallId requested', callIdRequestedCallback);
    });

    debug(JSON.stringify(callParameters, null, 4));

    res.send(callParameters);
}

async function createOnlineMeeting (): Promise<MeetingInfo> {
    const accessToken = await refreshAccessToken();

    const createMeetingQuery = `/me/onlineMeetings`;
    const createMeetingURL = path.join(config.apiBaseURL, createMeetingQuery);

    const createMeetingRes = await got.post(createMeetingURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            'startDateTime': '0001-01-01T00:00:00Z',
            'endDateTime':   '0001-01-01T00:00:00Z'
        }
    });

    const onlineMeeting = JSON.parse(createMeetingRes.body);

    const organizerId = onlineMeeting.participants.organizer.identity.user.id;
    const chatInfo = onlineMeeting.chatInfo;

    return {
        organizerId,
        chatInfo
    };
}

async function callMeeting ({ organizerId, chatInfo }: MeetingInfo): Promise<Call> {
    const organizerMeetingInfo: OrganizerMeetingInfo = populateUsers({ userIds: [organizerId], organizer: true })[0];

    organizerMeetingInfo.allowConversationWithoutHost = true;

    const callMeetingQuery = `/joinCall`;
    const callMeetingURL = path.join('https://myhuebot.ngrok.io', callMeetingQuery);

    const callMeetingRes = await got.post(callMeetingURL, {
        json: {
            'ChatInfo': JSON.stringify(chatInfo),
            'MeetingInfo': JSON.stringify(organizerMeetingInfo),
            'TenantId': config.tenantId
        }
    });
    
    /*"mediaConfig": {
        "@odata.type": "#microsoft.graph.appHostedMediaConfig",
        "blob": "{\"mpUri\":\"net.tcp://1.huebot.cf:28437/MediaProcessor\",\"audioRenderContexts\":[\"a9d685c9-22ed-4dbe-bfd7-58cc9ebdf254\"],\"videoRenderContexts\":[\"def2dc35-e8e2-421f-bce1-f35290d2beb9\"],\"audioSourceContexts\":[null],\"videoSourceContexts\":[\"c651c3f0-8304-4b73-a506-ba00cd2c2cf6\"],\"dataRenderContexts\":null,\"dataSourceContexts\":null,\"supportedAudioFormat\":\"Pcm16K\",\"videoSinkEncodingFormats\":[\"Yuv\"],\"mpMediaSessionId\":\"fca33a2d-a8d5-447f-b459-99fb1ac4ea21\",\"regionAffinity\":null,\"skypeMediaBotsVersion\":\"1.14.1.0234\",\"mediaStackVersion\":\"2019.45.1.7\",\"mpVersion\":\"7.2.0.6941\",\"callId\":\"3e3683db-74dc-4f6a-91ec-a78970972a0a\"}"
    }*/

    /*"mediaConfig": {
    "@odata.type": "#microsoft.graph.appHostedMediaConfig",
    "blob": "{\"mpUri\":\"net.tcp://1.huebot.cf:28437/MediaProcessor\",\"audioRenderContexts\":[\"c84e3bce-9c93-4a3b-8b66-59d3c4927745\"],\"videoRenderContexts\":[\"81658fd7-6bba-4a2e-91d5-b652429b4fc2\"],\"audioSourceContexts\":[null],\"videoSourceContexts\":[\"a753d627-0d1f-49b8-b3c3-cb48617c7510\"],\"dataRenderContexts\":null,\"dataSourceContexts\":null,\"supportedAudioFormat\":\"Pcm16K\",\"videoSinkEncodingFormats\":[\"Yuv\"],\"mpMediaSessionId\":\"dfc68190-3aa0-4345-be72-0ecb9fb3b1a5\",\"regionAffinity\":null,\"skypeMediaBotsVersion\":\"1.14.1.0234\",\"mediaStackVersion\":\"2019.45.1.7\",\"mpVersion\":\"7.2.0.6941\",\"callId\":\"e3848d71-9564-44b8-9d50-d3c12ff982b3\"}"
    }*/

    const callParameters = JSON.parse(callMeetingRes.body);

    return callParameters;
}

async function addParticipants ({ callId, userIds, accessToken }: { callId: string; userIds: string[]; accessToken: string}): Promise<void> {
    debug(`Adding ${userIds} to call ${callId}`);

    const addParticipantsQuery = `/communications/calls/${callId}/participants/invite`;
    const addParticipantsURL = path.join(config.apiBaseURL, addParticipantsQuery);

    const maxParticipantsPerRequest = 5;

    for (let participantIndex = 0, numParticipants = userIds.length; participantIndex < numParticipants; participantIndex += maxParticipantsPerRequest) {
        const participants = userIds.slice(participantIndex, participantIndex + maxParticipantsPerRequest);

        await got.post(addParticipantsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            json: {
                'participants':  populateUsers({ userIds: participants }),
                'clientContext': config.clientId
            }
        });
    }
}

function populateUsers ({ userIds, organizer = false }: { userIds: string[]; organizer?: boolean }): UserInfo[] | OrganizerMeetingInfo[] {
    const template = (userId: string): UserInfo | OrganizerMeetingInfo => {
        return {
            '@odata.type':                               organizer ? '#microsoft.graph.organizerMeetingInfo' : '#microsoft.graph.invitationParticipantInfo',
            [`${organizer ? 'organizer' : 'identity'}`]: {
                '@odata.type': '#microsoft.graph.identitySet',
                'user':        {
                    '@odata.type':                            '#microsoft.graph.identity',
                    'id':                                     `${userId}`,
                    [`${organizer ? 'tenantId' : 'tenant'}`]: `${config.tenantId}`
                }
            }
        };
    };

    return userIds.map((userId: string) => template(userId));
}
