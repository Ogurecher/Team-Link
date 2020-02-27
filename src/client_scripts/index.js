
async function getOnlineUsers () {
    const response = await fetch('http://localhost:3000/users');

    const onlineUsers = response.json();

    const rowTemplate = ({ displayName = 'Display Name', id = 'ID', status = 'Status', cellType = 'td' } = {}) => `
    <tr>
        <${cellType}>${displayName}</${cellType}>
        <${cellType}>${id}</${cellType}>
        <${cellType}>${status}</${cellType}>
    </tr>
    `;

    const rows = [ rowTemplate({ cellType: 'th' }) ];

    for (let user of await onlineUsers) {
        const userRow = rowTemplate({ displayName: user.displayName, id: user.id, status: user.status });
        
        rows.push(userRow);
    };

    const table = `<table>${rows.join('')}</table>`;

    document.getElementById('root').innerHTML = table;
}

function subscribe({ func = getOnlineUsers, pollingInterval = 10000 } = {}) {
    setInterval(func, pollingInterval);
}