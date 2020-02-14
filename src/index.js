if (require.main === module) {
    const App = require('./App.js');

    const app = new App();

    app.createServer();
}

module.exports = {
    App:    require('./App'),
    Server: require('./Server'),
    Config: require('./config')
};
