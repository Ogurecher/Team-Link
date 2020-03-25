import config from './clientConfig';

export async function hangUpCall (): Promise<void> {
    await fetch(config.hangUpEndpoint, {
        method: 'DELETE'
    });
}
