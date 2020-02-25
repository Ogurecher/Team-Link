import App from './App';

if (process.mainModule === module)
    App.createServer();


export { default as App } from './App';
export { default as Server } from './Server';
export { default as Config } from './Config';
