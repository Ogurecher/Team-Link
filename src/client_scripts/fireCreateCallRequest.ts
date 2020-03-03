import config from './clientConfig';

export function fireCreateCallRequest (): void {
    const userTableRows = document.getElementById(config.tableDOMElementId)?.getElementsByTagName('tr');
    const userIds = [].slice.call(userTableRows).map((tr: HTMLTableRowElement) => tr.cells[1].innerText);

    userIds.shift();

    const requestBody = {
        userIds: userIds
    };

    fetch(config.callEndpoint, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
}
