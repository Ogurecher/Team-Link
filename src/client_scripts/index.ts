import config from './clientConfig';


export async function getOnlineUsers (): Promise<void> {
    const response = await fetch('users');

    const onlineUsers = response.json();

    const rowTemplate = ({ displayName = 'Display Name', id = 'ID', status = 'Status', cellType = 'td' } = {}): string => `
    <tr>
        <${cellType}>${displayName}</${cellType}>
        <${cellType}>${id}</${cellType}>
        <${cellType}>${status}</${cellType}>
    </tr>
    `;

    const rows = [ rowTemplate({ cellType: 'th' }) ];

    for (const user of await onlineUsers) {
        const userRow = rowTemplate({ displayName: user.displayName, id: user.id, status: user.status });

        rows.push(userRow);
    }

    const table = `<table id="available_users">${rows.join('')}</table>`;

    const root = document.getElementById('root');

    if (root)
        root.innerHTML = table;

}


export function subscribe ({ func = getOnlineUsers } = {}): void {
    setInterval(func, config.pollingInterval);
}
