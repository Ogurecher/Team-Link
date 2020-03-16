import config from './clientConfig';

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

    const call = document.getElementById(config.callDOMElementId);
    const oldCallInfo = document.getElementById(config.callInfoDOMElementId);

    const callInfoText = `callId: ${callParameters.id}`;

    if (call && !oldCallInfo) {
        const callInfo = document.createElement('p');

        callInfo.id = config.callInfoDOMElementId;
        callInfo.innerText = callInfoText;

        call.appendChild(callInfo);
    }
    else if (oldCallInfo)
        oldCallInfo.innerText = callInfoText;

}
