
interface Window {
    debug: Function;
}


const debug = window.debug;

const error = debug('team-link:error');

interface ErrorInfo {
    type: string;
    message: string | undefined;
}

const sendError = (err: ErrorInfo): void => {
    fetch('clientError', {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(err)
    });
};

window.onerror = (message: string | Event, source: string | undefined, lineno: number | undefined, colno: number | undefined, err: Error | undefined) => {
    error(`An error occured. More info: ${err}`);
    sendError({ type: 'Error', message: err?.message });
};

window.onunhandledrejection = (err: PromiseRejectionEvent) => {
    error(`Unhandled rejection. More info: ${err}`);
    sendError({ type: err.type, message: err.reason.stack });
};
