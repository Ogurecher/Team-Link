const express = require('express');
const app = express();
const path = require('path');

const staticPath = path.join(__dirname, '..', 'resources', 'html');

app.use(express.static(staticPath));

class MyServer {

    listen () {
        const portNum = '3000';

        return new Promise((resolve, reject) => {
            this.server = app.listen(portNum, () => resolve()).on('error', reject);
            console.log(`Listening on port ${portNum}`);
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
