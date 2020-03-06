import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { getAppAccessToken, refreshAccessToken } from './token';
import { HTTPResponse, CreateCallRequest, MeetingInfo, Call, UserInfo, OrganizerMeetingInfo } from '../interfaces';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

export async function createCall (req: CreateCallRequest, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    const accessToken = await getAppAccessToken();

    const meetingInfo = await createOnlineMeeting();
    const callParameters = await callMeeting(meetingInfo);
    const callId = callParameters.id;

    setTimeout(() => {
        addParticipants({ callId, userIds: req.body.userIds, accessToken });
    }, 2000);

    debug(callParameters);

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
            'mediaConfig': {
                '@odata.type': '#microsoft.graph.serviceHostedMediaConfig'
            },
            'tenantId': `${config.tenantId}`
        }
    });

    const callParameters = JSON.parse(callMeetingRes.body);

    return callParameters;
}

async function addParticipants ({ callId, userIds, accessToken }: { callId: string; userIds: string[]; accessToken: string}): Promise<void> {
    const callMeetingQuery = `/communications/calls/${callId}/participants/invite`;
    const callMeetingURL = path.join(config.apiBaseURL, callMeetingQuery);

    await got.post(callMeetingURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            'participants':  populateUsers({ userIds }),
            'clientContext': config.clientId
        }
    });
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
