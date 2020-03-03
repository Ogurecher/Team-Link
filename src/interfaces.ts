import events from 'events';

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
    send(body: OnlineUser[] | string): void;
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
