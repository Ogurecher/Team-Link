import App from './App';
import debug from 'debug';

const error = debug('team-link:error');

process.on('unhandledRejection', err => {
    error(err);
});

process.on('uncaughtException', err => {
    error(err);
});

if (process.mainModule === module)
    App.create();


export { default as App } from './App';
export { default as Server } from './Server';
export { default as Config } from './Config';
