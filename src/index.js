if (require.main === module) {
    const { App } = require('./App.js');

    const app = new App();

    app.listen();
}
