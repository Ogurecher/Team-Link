const got = require('got');
const path = require('path');
const debugModule = require('debug');
const configImport = require('../config');

const config = configImport.config();
const debug = debugModule('team-link:debug');

module.exports = {
    getUsers: async function (req, res) {
        const groupQuery = `/groups?$filter=startswith(displayName,'dxdeveloper')&$select=displayName,id`;
        const groupURL = path.join(config.apiBaseURL, groupQuery);
        
        const groupRes = await got(groupURL, {headers: {Authorization: `Bearer ${config.accessToken}`}});
        const group = JSON.parse(groupRes.body).value[0];
    
        const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, 'General')&select=displayName,id`;
        const channelURL = path.join(config.apiBaseURL, channelQuery);
    
        const channelRes = await got(channelURL, {headers: {Authorization: `Bearer ${config.accessToken}`}});
        const channel = JSON.parse(channelRes.body).value[0];
    
        const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
        const usersURL = path.join(config.apiBaseURL, usersQuery);
    
        const usersRes = await got(usersURL, {headers: {Authorization: `Bearer ${config.accessToken}`}});
        const users = JSON.parse(usersRes.body).value.map((data) => {
            return {
                displayName: data.displayName,
                id: data.userId
            };
        });
        
        const onlineUsers = []; 
        for (let user of users) {
            const userStatusQuery = `/users/${user.id}/presence`;
            const userStatusURL = path.join(config.apiBaseURL, userStatusQuery);
    
            const userStatusRes = await got(userStatusURL, {headers: {Authorization: `Bearer ${config.accessToken}`}});
            const userStatus = {
                displayName: user.displayName,
                id: user.id,
                status: JSON.parse(userStatusRes.body).availability
            };
    
            if (userStatus.status === 'Available') {
                onlineUsers.push(userStatus);
            };
        };

        debug(onlineUsers);
    
        res.send(onlineUsers);
    }
};