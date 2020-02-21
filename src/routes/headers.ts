interface User {
    id: string;
    userId?: string;
    displayName: string;
}

interface OnlineUser extends User{
    status: string;
}

interface HTTPResponse {
    header(title: string, options: string | string[]): void;
    send(body: OnlineUser[]): void;
}

export function attachCORSHeaders ({ res }: { res: HTTPResponse }): HTTPResponse {
    res.header('Access-Control-Allow-Origin', ['*']);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    return res;
}
