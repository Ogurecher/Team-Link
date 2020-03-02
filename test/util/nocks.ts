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
