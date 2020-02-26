const debug = window.debug;
localStorage.debug = 'team-link:*';

const info = debug('team-link:info');
const error = debug('team-link:error');

window.onerror = (err) => {
    error(`An error occured. More info: ${err}`);
    throw err;
};

window.onunhandledrejection = (err) => {
    error(`Unhandled rejection. More info: ${err}`);
    throw err;
};