if (require.main === module) {
    const MyServer = require('./MyServer.js');

    const server = new MyServer();

    server.listen();

    const nondefaultServer = new MyServer('8080', 'localhost');

    nondefaultServer.listen();
}
