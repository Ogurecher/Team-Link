const path = require('path');
const express = require('express');

require('dotenv').config({ path: path.join(__dirname, '../config/.env') });
const app = express();

const staticPath = path.join(__dirname, '../resources/html');

app.use(express.static(staticPath));

class MyServer {

    listen (port = process.env.PORT, host = process.env.HOST) {
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
