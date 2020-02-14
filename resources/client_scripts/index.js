
async function getOnlineUsers () {
    const response = await fetch('http://localhost:3000/users');

    const onlineUsers = response.json();

    const headerRow = `<tr>
        <th>Display name</th>
        <th>ID</th>
        <th>Status</th>
    </tr>`;

    const rows = [ headerRow ];

    for (let user of await onlineUsers) {
        const userRow = `<tr>
            <td>${user.displayName}</td>
            <td>${user.id}</td>
            <td>${user.status}</td>
        </tr>`;
        
        rows.push(userRow);
    };

    const table = `<table>${rows.join('')}</table>`;

    document.getElementById('root').innerHTML = table;
}
