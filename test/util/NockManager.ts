import nock from 'nock';
import { interfaces } from '../../';

export class NockManager {
    private config: interfaces.DefaultConfiguration;
    private regExpMap: {[name: string]: RegExp}

    private initializeRegExpMap (): {[name: string]: RegExp} {
        return {
            'getTokenNocks':           /\/.*\/.*\/.*\/token/,
            'getGroupNocks':           /\/groups/,
            'getChannelNocks':         /\/teams\/.*\/channels\?/,
            'getUsersNocks':           /\/teams\/.*\/channels\/.*\/members/,
            'getPresencesNocks':       /\/communications\/getPresencesByUserId/,
            'createMeetingNocks':      /\/me\/onlineMeetings/,
            'createCallNocks':         /\/communications\/calls$/,
            'joinCallNocks':           /\/joinCall/,
            'hangUpNocks':             /\/communications\/calls\/.*/,
            'inviteParticipantsNocks': /\/communications\/calls\/.*\/participants\/invite/,
            'rejectCallNocks':         /\/communications\/calls\/.*\/reject/
        };
    }

    private getEmptyNocks (): interfaces.Nocks {
        return {
            'getTokenNocks':           [],
            'getGroupNocks':           [],
            'getChannelNocks':         [],
            'getUsersNocks':           [],
            'getPresencesNocks':       [],
            'createMeetingNocks':      [],
            'createCallNocks':         [],
            'joinCallNocks':           [],
            'hangUpNocks':             [],
            'inviteParticipantsNocks': [],
            'rejectCallNocks':         []
        };
    }

    public nocks: interfaces.Nocks;

    public constructor (config: interfaces.DefaultConfiguration) {
        this.config = config;
        this.regExpMap = this.initializeRegExpMap();
        this.nocks = this.getEmptyNocks();
    }

    public setupNock ({ url = this.config.apiBaseURL, method, name, response = { status: 200 }, quantity = 1 }:
        {url?: string; method: string; name: string; response?: interfaces.NockResponse; quantity?: number}): nock.Scope[] {

        const nocksList: nock.Scope[] = [];

        for (let i = 0; i < quantity; i++) {
            let interceptor;

            if (method === 'post')
                interceptor = nock(url).post(this.regExpMap[name]);
            else if (method === 'get')
                interceptor = nock(url).get(this.regExpMap[name]);
            else
                interceptor = nock(url).delete(this.regExpMap[name]);


            const resultNock = interceptor.reply(response.status, response.body);

            nocksList.push(resultNock);
            this.nocks[name].push(resultNock);
        }

        return nocksList;
    }

    public cleanNocks (): void {
        nock.cleanAll();
        this.nocks = this.getEmptyNocks();
    }

    public setupAllNocks (): void {
        this.nocks['getTokenNocks'] = this.setupNock({
            url:      this.config.authorizationBaseURL,
            method:   'post',
            name:     'getTokenNocks',
            response: {
                status: 200,
                body:   { 'access_token': 'token' }
            },
            quantity: 3
        });

        this.nocks['getGroupNocks'] = this.setupNock({
            method:   'get',
            name:     'getGroupNocks',
            response: {
                status: 200,
                body:   {
                    value: [
                        {
                            id: 'groupId'
                        }
                    ]
                }
            }
        });

        this.nocks['getChannelNocks'] = this.setupNock({
            method:   'get',
            name:     'getChannelNocks',
            response: {
                status: 200,
                body:   {
                    value: [
                        {
                            id: 'channelId'
                        }
                    ]
                }
            }
        });

        this.nocks['getUsersNocks'] = this.setupNock({
            method:   'get',
            name:     'getUsersNocks',
            response: {
                status: 200,
                body:   {
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
                }
            }
        });

        this.nocks['getPresencesNocks'] = this.setupNock({
            method:   'post',
            name:     'getPresencesNocks',
            response: {
                status: 200,
                body:   {
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
                }
            }
        });

        this.nocks['createMeetingNocks'] = this.setupNock({
            method:   'post',
            name:     'createMeetingNocks',
            response: {
                status: 200,
                body:   {
                    participants: {
                        organizer: {
                            identity: {
                                user: {
                                    id: 'organizerId1'
                                }
                            }
                        }
                    },
                    chatInfo: {
                        threadId: 'threadId1'
                    }
                }
            }
        });

        this.nocks['createCallNocks'] = this.setupNock({
            method:   'post',
            name:     'createCallNocks',
            response: {
                status: 200,
                body:   { id: 'callId1' }
            }
        });

        this.nocks['joinCallNocks'] = this.setupNock({
            url:      this.config.mediaModuleURI,
            method:   'post',
            name:     'joinCallNocks',
            response: {
                body:   { id: 'callId1' },
                status: 200
            }
        });

        this.nocks['inviteParticipantsNocks'] = this.setupNock({
            method: 'post',
            name:   'inviteParticipantsNocks'
        });

        this.nocks['rejectCallNocks'] = this.setupNock({
            method:   'post',
            name:     'rejectCallNocks',
            response: {
                status: 202
            }
        });

        this.nocks['hangUpNocks'] = this.setupNock({
            method:   'delete',
            name:     'hangUpNocks',
            response: {
                status: 204
            }
        });
    }
}
