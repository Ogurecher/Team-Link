const express = require('express');
const app = express();
const path = require('path');

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');

    res.sendFile(htmlPath);
});

class MyServer {

    listen () {
        return new Promise((resolve, reject) => {
            this.server = app.listen(3000, () => resolve()).on('error', reject);
            console.log('Listening on port 3000');
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
