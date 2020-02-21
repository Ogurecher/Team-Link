import App from './App';
import debug from 'debug';

const error = debug('team-link:error');

process.on('unhandledRejection', () => {
    error('Unhandled promise rejection');
    throw new Error('Unhandled promise rejection');
});

process.on('uncaughtException', () => {
    error('Uncaught exception');
    throw new Error('Uncaught exception');
});

if (process.mainModule === module)
    App.create();


export { default as App } from './App';
export { default as Server } from './Server';
export { default as Config } from './Config';
