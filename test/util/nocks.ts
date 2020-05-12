import nock from 'nock';
import { interfaces } from '../../';

export function nockRequests (config: interfaces.DefaultConfiguration): nock.Scope {
    nock(config.authorizationBaseURL)
        .persist()
        .post(/\/.*\/.*\/.*\/token/)
        .reply(200, {
            'access_token': 'token'
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/groups/)
        .reply(200, {
            value: [
                {
                    id: 'groupId'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/teams\/.*\/channels\?/)
        .reply(200, {
            value: [
                {
                    id: 'channelId'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .get(/\/teams\/.*\/channels\/.*\/members/)
        .reply(200, {
            value: [
                {
                    userId:      'userId1',
                    displayName: 'username1'
                },
                {
                    userId:      'userId2',
                    displayName: 'username2'
                }
            ]
        });

    const userPresences = nock(config.apiBaseURL)
        .persist()
        .post(/\/communications\/getPresencesByUserId/)
        .reply(200, {
            value: [
                {
                    id:           'userId1',
                    availability: 'Available'
                },
                {
                    id:           'userId2',
                    availability: 'Offline'
                }
            ]
        });

    nock(config.apiBaseURL)
        .persist()
        .post(/\/me\/onlineMeetings/)
        .reply(200, {
            participants: {
                organizer: {
                    identity: {
                        user: {
                            id: 'organizerId1'
                        }
                    }
                }
            },
            chatInfo: 'chatInfo1'
        });

    nock(config.apiBaseURL)
        .persist()
        .post(/\/communications\/calls$/)
        .reply(200, {
            id: 'callId1'
        });

    return userPresences;
}

export function nockUserPresencesOnce (config: interfaces.DefaultConfiguration): void {
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
}

export function nockUserPresencesPersist (config: interfaces.DefaultConfiguration): void {
    nock(config.apiBaseURL)
        .persist()
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
}

export function nockCallRejectionOnce (config: interfaces.DefaultConfiguration): nock.Scope {
    const callRejectionScope = nock(config.apiBaseURL)
        .post(/\/communications\/calls\/.*\/reject/)
        .reply(202);

    return callRejectionScope;
}

export function nockInviteParticipantsOnce (config: interfaces.DefaultConfiguration): nock.Scope {
    const addParticipantsNock = nock(config.apiBaseURL)
        .post(/\/communications\/calls\/.*\/participants\/invite/)
        .reply(200);

    return addParticipantsNock;
}

export function cleanNocks (): void {
    nock.cleanAll();
}
