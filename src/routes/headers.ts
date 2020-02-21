import { HTTPResponse } from './users';

export function attachCORSHeaders ({ res }: { res: HTTPResponse }): HTTPResponse {
    res.header('Access-Control-Allow-Origin', ['*']);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    return res;
}
