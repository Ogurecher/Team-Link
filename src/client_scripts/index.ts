import config from './clientConfig';
import { renderTable } from './reactRenderer';


export async function getOnlineUsers (): Promise<void> {
    const response = await fetch(config.usersEndpoint);

    const onlineUsers = await response.json();

    renderTable(onlineUsers);
}


export function subscribe ({ func = getOnlineUsers } = {}): void {
    setInterval(func, config.pollingInterval);
}
