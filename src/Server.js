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

        this.app.get('/users', async (req, res) => {
            const baseURL = 'https://graph.microsoft.com/beta';
            const token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkhJZktPTE1KUjZIMVVfYmNrZFlzeXpIaEdfQTZkZWQ5QkNwZ1N0WF9VX0UiLCJhbGciOiJSUzI1NiIsIng1dCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSIsImtpZCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzcvIiwiaWF0IjoxNTgxNTkxODIxLCJuYmYiOjE1ODE1OTE4MjEsImV4cCI6MTU4MTU5NTcyMSwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IjQyTmdZTWhSOHFzSnFOZGZ0Zm1aNUFldnIvc2V6bVBhZWFEa3RLdmtKRWF1ZTR5OXZkY0EiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlRlYW0gTGluayIsImFwcGlkIjoiMzdiNjA0ZWItZGJiOC00OTVjLTk2MzgtODg0YjNiOWM1ZDcyIiwiYXBwaWRhY3IiOiIxIiwiZmFtaWx5X25hbWUiOiJBZG1pbiIsImdpdmVuX25hbWUiOiIyMTAiLCJpcGFkZHIiOiI4Ni4xMTAuMTk1LjEwNiIsIm5hbWUiOiIyMTAgQWRtaW4iLCJvaWQiOiJiY2NmZjY0Yi03N2ZjLTQwNGEtYTViOC1mMjA4YzdhMGYxYjYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDA5QUMwMzg1NiIsInNjcCI6IkNoYXQuUmVhZFdyaXRlIEdyb3VwLlJlYWQuQWxsIE1haWwuUmVhZCBQcmVzZW5jZS5SZWFkLkFsbCBVc2VyLlJlYWQgVXNlci5SZWFkLkFsbCBwcm9maWxlIG9wZW5pZCBlbWFpbCIsInN1YiI6Ii1VdXE4LWhPMWpVbk8teXE2RzNtNTBQWlNnRm9NSm41U0VHWExKR0QwQUkiLCJ0aWQiOiI3NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzciLCJ1bmlxdWVfbmFtZSI6IjIxMF9hZG1pbkBkeGRldmVsb3Blci5vbm1pY3Jvc29mdC5jb20iLCJ1cG4iOiIyMTBfYWRtaW5AZHhkZXZlbG9wZXIub25taWNyb3NvZnQuY29tIiwidXRpIjoiQmo3bnJjUWphMDJuWW9PYWVwRDFBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiNjkwOTEyNDYtMjBlOC00YTU2LWFhNGQtMDY2MDc1YjJhN2E4Il0sInhtc19zdCI6eyJzdWIiOiJyZlBBNURqdS1SNWpCTFpHVmZiQW9RRC1tR3kxQWRObF82Q2RMWlJTbXowIn0sInhtc190Y2R0IjoxNTgxNDA5MjEyfQ.fb7HS5vjjf_saDiMG8ogTIvgNy7K1sUfWADFXIlJMe5oPblin8K-Oh4hnsdNjfMaTjo8tkD4JdsQTAZKrESO8ch7m2Kej39RDNCfVBwm3AL1WoDhf16crXrlFSBEOCBXYUpD0oBBjGZR1Ha7akraff0HxPz1_tJpH0dlI4t8_cYPZNPfz60Wh9d1jTDtyY0inxJqDDJgPohkGe_sMcQ3B4F5IumZDPgKeVCh4u7WKf3PvyNtY-jgbdAMl9T23NYV3UwGHxx0032qnVY85_EVHnX3BTDOzMwgK40C2fzAqYQdZqInCNpCY3LVMrZz7ZBjA4PfaVDEoL-R6JgwI8smEw';

            const groupQuery = `/groups?$filter=startswith(displayName,'dxdeveloper')&$select=displayName,id`;
            const groupURL = path.join(baseURL, groupQuery);
            
            const groupRes = await got(groupURL, {headers: {Authorization: `Bearer ${token}`}});
            const group = JSON.parse(groupRes.body).value[0];

            const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, 'General')&select=displayName,id`;
            const channelURL = path.join(baseURL, channelQuery);

            const channelRes = await got(channelURL, {headers: {Authorization: `Bearer ${token}`}});
            const channel = JSON.parse(channelRes.body).value[0];

            const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
            const usersURL = path.join(baseURL, usersQuery);

            const usersRes = await got(usersURL, {headers: {Authorization: `Bearer ${token}`}});
            const users = JSON.parse(usersRes.body).value.map((data) => {
                return {
                    displayName: data.displayName,
                    id: data.userId
                };
            });
            
            const onlineUsers = []; 
            for (let user of users) {
                const userStatusQuery = `/users/${user.id}/presence`;
                const userStatusURL = path.join(baseURL, userStatusQuery);

                const userStatusRes = await got(userStatusURL, {headers: {Authorization: `Bearer ${token}`}});
                const userStatus = {
                    displayName: user.displayName,
                    id: user.id,
                    status: JSON.parse(userStatusRes.body).availability
                };

                if (userStatus.status === 'Available') {
                    onlineUsers.push(userStatus);
                };
            };
   
            res.send(onlineUsers);
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