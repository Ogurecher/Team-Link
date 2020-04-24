import got from 'got';
import debugModule from 'debug';
import events from 'events';
import { CallbackRequest, HTTPResponse } from '../interfaces';

const debug = debugModule('team-link:callback');

export const notifier = new events.EventEmitter();

export async function callback (req: CallbackRequest, res: HTTPResponse): Promise<void> {
    debug(JSON.stringify(req.body, null, 4));

    if (req.body.value[0].resourceData.state === 'established')
        notifier.emit('Call established');

    if (req.body.value[0].resourceData.state === 'terminated') {
        debug('call terminated');
        notifier.emit('Call terminated');
    }

    got.post('https://myhuebot.ngrok.io/api/calls', {
        json: req.body
    });

    res.status(200);
    res.end();
}
