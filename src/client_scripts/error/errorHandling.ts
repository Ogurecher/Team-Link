import debug from 'debug';

interface ErrorInfo {
    name?: string;
    message?: string;
    stack?: string;
}

const error = debug('team-link:error');

const sendError = (err: ErrorInfo): void => {
    fetch('clientError', {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(err)
    });
};

window.onerror = (message: unknown, source: unknown, lineno: unknown, colno: unknown, err: Error | undefined) => {
    error(`An error occured. More info: ${err}`);
    sendError({ name: err?.name, message: err?.message, stack: err?.stack });
};

window.onunhandledrejection = (err: PromiseRejectionEvent) => {
    error(`Unhandled rejection. More info: ${err}`);
    sendError({ name: err.type, message: err.reason.message, stack: err.reason.stack });
};
