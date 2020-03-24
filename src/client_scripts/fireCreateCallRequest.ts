import config from './clientConfig';
import { renderCallInfo } from './reactRenderer';

export async function fireCreateCallRequest (): Promise<void> {
    const userTableRows = document.getElementById(config.tableDOMElementId)?.getElementsByTagName('tr');
    const userIds = [].slice.call(userTableRows).map((tr: HTMLTableRowElement) => tr.cells[1].innerText);

    userIds.shift();

    const requestBody = {
        userIds: userIds
    };

    const callResponse = await fetch(config.callEndpoint, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const callParameters = await callResponse.json();

    renderCallInfo(callParameters.id);
}
