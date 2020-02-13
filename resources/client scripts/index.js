fetch('http://localhost:3000/users')
.then((res) => res.json())
.then((onlineUsers) => {
    const userTable = document.createElement('table');
    userTable.style.border = '2px solid #000';

    const headerRow = document.createElement('tr');

    createTableCell('Display name', headerRow);
    createTableCell('ID', headerRow);
    createTableCell('Status', headerRow);

    userTable.appendChild(headerRow);

    for (let user of onlineUsers) {
        const userRow = document.createElement('tr');

        createTableCell(user.displayName, userRow);
        createTableCell(user.id, userRow);
        createTableCell(user.status, userRow);

        userTable.appendChild(userRow);
    }

    document.getElementById('root').appendChild(userTable);
});

function createTableCell(text, parent) {
    const cell = document.createElement('td');
    const textNode = document.createTextNode(text);

    cell.appendChild(textNode);
    cell.style.border = '1px solid #000';

    parent.appendChild(cell);
}