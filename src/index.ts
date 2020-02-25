import App from './App';

if (process.mainModule === module) {
    const app = new App();

    app.createServer();
}

export { default as App } from './App';
export { default as Server } from './Server';
export { default as Config } from './Config';
