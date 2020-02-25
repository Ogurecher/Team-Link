import App from './App';

if (process.mainModule === module)
    App.create();


export { default as App } from './App';
export { default as Server } from './Server';
export { default as Config } from './Config';
