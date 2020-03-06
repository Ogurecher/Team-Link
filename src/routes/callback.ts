import debugModule from 'debug';
import { CallbackRequest, HTTPResponse } from '../interfaces';

const debug = debugModule('team-link:callback');

export async function callback (req: CallbackRequest, res: HTTPResponse): Promise<void> {
    debug(JSON.stringify(req.body, null, 4));

    res.status(200);
    res.end();
}
