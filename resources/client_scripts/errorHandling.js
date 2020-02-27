const debug = window.debug;
localStorage.debug = 'team-link:*';

const info = debug('team-link:info');
const error = debug('team-link:error');

const getErrorInfo = (err) => {
    return {
        type: err.type,
        stack: err.reason.stack
    }
}

const sendError = (err) => {
    fetch('http://localhost:3000/clientError', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(getErrorInfo(err))
    });
}

window.onerror = (err) => {
    error(`An error occured. More info: ${err}`);
    sendError(err);
};

window.onunhandledrejection = (err) => {
    error(`Unhandled rejection. More info: ${err}`);
    sendError(err);
};