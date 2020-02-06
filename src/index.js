const path = require('path');
const express = require('express');
const config = require('./config.js').config();

const app = express();

const staticPath = path.join(__dirname, '../resources/html');

app.use(express.static(staticPath));

class MyServer {

    listen (port = config.port, host = config.host) {
        return new Promise((resolve, reject) => {
            this.server = app.listen(port, host, () => resolve()).on('error', reject);
            console.log(`Listening on port ${port}`);
        });
    }

    close () {
        return new Promise((resolve, reject) => {
            this.server = this.server.close(() => resolve()).on('error', reject);
        });
    }
}

if (require.main === module) {
    const server = new MyServer();

    server.listen();
}

exports.MyServer = MyServer;
