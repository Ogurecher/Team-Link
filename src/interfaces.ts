import events from 'events';

export interface HTTPPostRequest {
    body: {};
}

export interface CallbackRequest {
    body: {
        value: [
            {
                resourceData: {
                    state: string;
                };
            }
        ];
    };
}

export interface CreateCallRequest extends HTTPPostRequest {
    body: {
        userIds: string[];
    };
}

export interface MeetingInfo {
    organizerId: string;
    chatInfo: {};
}

export interface UserInfo {
    '@odata.type': string;
    identity?: {};
    organizer?: {};
}

export interface OrganizerMeetingInfo extends UserInfo {
    allowConversationWithoutHost?: boolean;
}

export interface Call {
    id: string;
}

export interface Group {
    id: string;
}

export interface Channel {
    id: string;
}

export interface User {
    id: string;
    userId?: string;
    displayName: string;
}

export interface Presence {
    id: string;
    status: string;
    availability: string;
}

export interface OnlineUser extends User{
    status: string;
}

export interface HTTPResponse {
    header(title: string, options: string | string[]): void;
    send(body: unknown): void;
    status(code: number): void;
    end(): void;
}

export interface Options {
    port: string;
    host: string;
    staticPath: string;
    clientPath: string;
}

export interface DefaultConfiguration {
    port: string;
    host: string;
    staticPath: string;
    clientPath: string;
    apiBaseURL: string;
    authorizationBaseURL: string;
    oauthVersion: string;
    callbackURI: string;
}

export interface Configuration extends DefaultConfiguration {
    accessToken: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

export interface ExpressServer extends events.EventEmitter {
    close(): void;
}
