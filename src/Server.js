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
            const baseURL = 'https://graph.microsoft.com/beta';
            const token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6InMtb1pqRl8yS0NnSzB6WVlXRkxWVmNHLWxyQ0pLTlpGQ1dQWk5RRkJxa1EiLCJhbGciOiJSUzI1NiIsIng1dCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSIsImtpZCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzcvIiwiaWF0IjoxNTgxNTg1MDY4LCJuYmYiOjE1ODE1ODUwNjgsImV4cCI6MTU4MTU4ODk2OCwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFTUUEyLzhPQUFBQThHSVZiTTVDd0dUaTQ2SGw1bFZRN3Z1NWw0YzEzd1hhRTJJRFduRkl0cUk9IiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJUZWFtIExpbmsiLCJhcHBpZCI6IjM3YjYwNGViLWRiYjgtNDk1Yy05NjM4LTg4NGIzYjljNWQ3MiIsImFwcGlkYWNyIjoiMSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnaXZlbl9uYW1lIjoiMjEwIiwiaXBhZGRyIjoiODYuMTEwLjE5NS4xMDAiLCJuYW1lIjoiMjEwIEFkbWluIiwib2lkIjoiYmNjZmY2NGItNzdmYy00MDRhLWE1YjgtZjIwOGM3YTBmMWI2IiwicGxhdGYiOiIzIiwicHVpZCI6IjEwMDMyMDAwOUFDMDM4NTYiLCJzY3AiOiJDaGF0LlJlYWRXcml0ZSBHcm91cC5SZWFkLkFsbCBNYWlsLlJlYWQgUHJlc2VuY2UuUmVhZC5BbGwgVXNlci5SZWFkIFVzZXIuUmVhZC5BbGwgcHJvZmlsZSBvcGVuaWQgZW1haWwiLCJzdWIiOiItVXVxOC1oTzFqVW5PLXlxNkczbTUwUFpTZ0ZvTUpuNVNFR1hMSkdEMEFJIiwidGlkIjoiNzc1NzQzYTEtN2RhMi00Nzg1LTgzM2UtYThlY2JmMzdjOTM3IiwidW5pcXVlX25hbWUiOiIyMTBfYWRtaW5AZHhkZXZlbG9wZXIub25taWNyb3NvZnQuY29tIiwidXBuIjoiMjEwX2FkbWluQGR4ZGV2ZWxvcGVyLm9ubWljcm9zb2Z0LmNvbSIsInV0aSI6IkVudnJpWHMtTGtpcUZ5bWRSeDN5QUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbIjY5MDkxMjQ2LTIwZTgtNGE1Ni1hYTRkLTA2NjA3NWIyYTdhOCJdLCJ4bXNfc3QiOnsic3ViIjoicmZQQTVEanUtUjVqQkxaR1ZmYkFvUUQtbUd5MUFkTmxfNkNkTFpSU216MCJ9LCJ4bXNfdGNkdCI6MTU4MTQwOTIxMn0.nlswZy9M1qt6oUsUTxjzMnunu5SGtAVm3UA7UVPE6EAaMW6RMPZTLHEjtpdhgR9Ook-cK413A6bVcOzwMLf4RvUEJv1RMe_W5J-9ul22EMI5mlBAY0ELwVHFmMSmuhtgeexh6VNpMQ0eJb1VZxk8B2JyRF6UiMNbR-5m6xyj12T7BZ5wFLMFax0ZxiSgDvBKENNbNgPdKkdzUmAOzhS-DZV_2gnKN8fLuDn7-qfsH-Fp0cqXehy2Qm5qpi7NkgrkMTv1kavo6pDhKKPRZ1NguYO6Q47KHY3oTeDfYF3KWW9QmeAhnV0WV_I7pNPK0ROZuuxbkBpoLJOX7jpO8QaQdQ';

            const groupQuery = `/groups?$filter=startswith(displayName,'dxdeveloper')&$select=displayName,id`;
            const groupURL = path.join(baseURL, groupQuery);
            
            const group = await got(groupURL, {headers: {Authorization: `Bearer ${token}`}})
            .then((res) => {
                return JSON.parse(res.body).value[0];
            });
            console.log(group);

            const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, 'General')&select=displayName,id`;
            const channelURL = path.join(baseURL, channelQuery);

            const channel = await got(channelURL, {headers: {Authorization: `Bearer ${token}`}})
            .then((res) => {
                return JSON.parse(res.body).value[0];
            });
            console.log(channel);

            const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
            const usersURL = path.join(baseURL, usersQuery);

            const users = await got(usersURL, {headers: {Authorization: `Bearer ${token}`}})
            .then((res) => {
                return JSON.parse(res.body).value.map((data) => {
                    return {
                        displayName: data.displayName,
                        id: data.userId
                    }
                });
            });
            console.log(users);
            
            const onlineUsers = []; 
            for (let user of users) {
                const userStatusQuery = `/users/${user.id}/presence`;
                const userStatusURL = path.join(baseURL, userStatusQuery);

                const userStatus = await got(userStatusURL, {headers: {Authorization: `Bearer ${token}`}})
                .then((res) => {
                    return {
                        displayName: user.displayName,
                        status: JSON.parse(res.body).availability
                    }
                });

                if (userStatus.status === 'Available') {
                    onlineUsers.push(userStatus);
                };
            };

            console.log(onlineUsers);
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