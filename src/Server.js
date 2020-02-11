const { once } = require('events');
const path = require('path');
const express = require('express');
const debug = require('debug');
const configImport = require('./config.js');

const config = configImport.config();
const info = debug('team-link:info');
const error = debug('team-link:error');

class Server {
    constructor(app, port, host, staticPath) {
        this.app = app;
        this.host = host;
        this.port = port;
        this.staticPath = path.join(__dirname, staticPath);

        this.app.use(express.static(this.staticPath));

        this.app.get('/users', async () => {
            console.log('users');
            const baseURL = 'https://graph.microsoft.com/beta/';
            const usersURL = path.join(baseURL, 'users');
            const token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkVRYUlGWnMyRGhuMkFhOGk1TmRfckNFeDFTTnE2T0JmZHlUbjJnSUJWMDgiLCJhbGciOiJSUzI1NiIsIng1dCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSIsImtpZCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzcvIiwiaWF0IjoxNTgxNDM1MTk2LCJuYmYiOjE1ODE0MzUxOTYsImV4cCI6MTU4MTQzOTA5NiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IjQyTmdZSEJqRitoakRvbWNmTXY0clR2M2RrV1pXOU5iZjZ5ZXd6ZG5TbUxWcWVCV3QxZ0EiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlRlYW0gTGluayIsImFwcGlkIjoiMzdiNjA0ZWItZGJiOC00OTVjLTk2MzgtODg0YjNiOWM1ZDcyIiwiYXBwaWRhY3IiOiIxIiwiZmFtaWx5X25hbWUiOiJBZG1pbiIsImdpdmVuX25hbWUiOiIyMTAiLCJpcGFkZHIiOiI4Ni4xMTAuMTk1LjEwMCIsIm5hbWUiOiIyMTAgQWRtaW4iLCJvaWQiOiJiY2NmZjY0Yi03N2ZjLTQwNGEtYTViOC1mMjA4YzdhMGYxYjYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDA5QUMwMzg1NiIsInNjcCI6IkNoYXQuUmVhZFdyaXRlIE1haWwuUmVhZCBQcmVzZW5jZS5SZWFkLkFsbCBVc2VyLlJlYWQgVXNlci5SZWFkLkFsbCBwcm9maWxlIG9wZW5pZCBlbWFpbCIsInN1YiI6Ii1VdXE4LWhPMWpVbk8teXE2RzNtNTBQWlNnRm9NSm41U0VHWExKR0QwQUkiLCJ0aWQiOiI3NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzciLCJ1bmlxdWVfbmFtZSI6IjIxMF9hZG1pbkBkeGRldmVsb3Blci5vbm1pY3Jvc29mdC5jb20iLCJ1cG4iOiIyMTBfYWRtaW5AZHhkZXZlbG9wZXIub25taWNyb3NvZnQuY29tIiwidXRpIjoiR29zMjduNFU0RW1mdEZEZkhFYU1BQSIsInZlciI6IjEuMCIsIndpZHMiOlsiNjkwOTEyNDYtMjBlOC00YTU2LWFhNGQtMDY2MDc1YjJhN2E4Il0sInhtc19zdCI6eyJzdWIiOiJyZlBBNURqdS1SNWpCTFpHVmZiQW9RRC1tR3kxQWRObF82Q2RMWlJTbXowIn0sInhtc190Y2R0IjoxNTgxNDA5MjEyfQ.qOYPpClwDItOzUZjeAmrm0WGhEMVadEf-6KPnCqPU4Ta5vjiw5GygAFqrfe1rDYNyT08pMwnHy2rbbADejbsdhNVgEkDiq2bLEBuaMwmw12nwl1LDUTnxk6DsZC6w3Hrx2Uhq9t4bHEYqx0EBz3-eWrIS5jC7porVm3CoHBMIfBwm9W6w_aH5FZryWw72bv83xzsx_gsD9kPgU5l6uULsyWTq4I9v9IFxpKVEsZYL49FzDLP-wHLanHwyhZvB9L7RhCzyCV-lHuWVn3RJGL65ZwiS2Pb-g2fIPjKKaFaFKneKG08bzYTrFcgF0wUnNYaoEGQtMFKkX2MhLhRmR2bPg';
            const result = await got(usersURL, {headers: {Authorization: `Bearer ${token}`}});
            const users = JSON.parse(result.body).value.map(({id, displayName}) => {
                return { id, displayName };
            });
            for (let user of users) {
                const userOnlineURL = path.join(usersURL, user.id, '/presence');
                const res = await got(userOnlineURL, {headers: {Authorization: `Bearer ${token}`}});
                console.log(user.displayName);
                console.log(JSON.parse(res.body).availability);
            }
        });
    }

    async listen () {
        try {
            this.server = await this.app.listen(this.port, this.host);

            await once(this.server, 'listening');
            info(`Server listening on port ${this.port}, host: ${this.host}`);
        }
        catch (err) {
            error(err);
            throw err;
        }
    }

    async close () {
        try {
            await this.server.close();
        }
        catch (err) {
            error(err);
            throw err;
        }
    }
}

module.exports = Server;