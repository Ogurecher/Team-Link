import debugModule from 'debug';

const error = debugModule('team-link:error');

interface HTTPRequest {
    body: {};
}

export async function handleClientError (req: HTTPRequest): Promise<void> {
    error(req.body);
}
