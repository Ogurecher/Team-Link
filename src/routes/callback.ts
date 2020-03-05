import debugModule from 'debug';
import { CallbackRequest, HTTPResponse } from '../interfaces';

const debug = debugModule('team-link:callback');

export async function callback (req: CallbackRequest, res: HTTPResponse): Promise<void> {
    debug(req.body);
    debug('-------resourceData:');
    debug(req.body.value[0].resourceData);

    res.status(200);
    res.end();
}
