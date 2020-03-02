
interface Window {
    debug: Function;
}


const debug = window.debug;

const error = debug('team-link:error');

interface ErrorInfo {
    name: string | undefined;
    message: string | undefined;
    stack: string | undefined;
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
    sendError({ name: err?.name, message: err?.message, stack: err?.stack });
};

window.onunhandledrejection = (err: PromiseRejectionEvent) => {
    error(`Unhandled rejection. More info: ${err}`);
    sendError({ name: err.type, message: err.reason.message, stack: err.reason.stack });
};
