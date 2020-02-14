const got = require('got');
const path = require('path');
const debugModule = require('debug');
const Config = require('../Config');
const { attachCORSHeaders } = require('./headers');
const { refreshAccessToken } = require('./token');

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

async function getGroup ({ displayName }) {
    const groupQuery = `/groups?$filter=startswith(displayName,'${displayName}')&$select=displayName,id`;
    const groupURL = path.join(config.apiBaseURL, groupQuery);

    const groupRes = await got(groupURL, { headers: { Authorization: `Bearer ${config.accessToken}` } });

    return JSON.parse(groupRes.body).value[0];
}

async function getChannel ({ group, displayName }) {
    const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, '${displayName}')&select=displayName,id`;
    const channelURL = path.join(config.apiBaseURL, channelQuery);

    const channelRes = await got(channelURL, { headers: { Authorization: `Bearer ${config.accessToken}` } });

    return JSON.parse(channelRes.body).value[0];
}

async function getAllUsers ({ group, channel }) {
    const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
    const usersURL = path.join(config.apiBaseURL, usersQuery);

    const usersRes = await got(usersURL, { headers: { Authorization: `Bearer ${config.accessToken}` } });

    return JSON.parse(usersRes.body).value.map(data => {
        return {
            displayName: data.displayName,
            id:          data.userId
        };
    });
}

async function getUserStatus ({ user }) {
    const userStatusQuery = `/users/${user.id}/presence`;
    const userStatusURL = path.join(config.apiBaseURL, userStatusQuery);

    const userStatusRes = await got(userStatusURL, { headers: { Authorization: `Bearer ${config.accessToken}` } });

    return {
        displayName: user.displayName,
        id:          user.id,
        status:      JSON.parse(userStatusRes.body).availability
    };
}

async function getOnlineUsers (req, res) {
    res = attachCORSHeaders({ res });

    const group = await getGroup({ displayName: 'dxdeveloper' });
    const channel = await getChannel({ group, displayName: 'General' });
    const users = await getAllUsers({ group, channel });

    const onlineUsers = [];

    for (const user of users) {
        const userStatus = await getUserStatus({ user });

        if (userStatus.status === 'Available')
            onlineUsers.push(userStatus);

    }

    debug(onlineUsers);

    res.send(onlineUsers);
}

module.exports = {
    getOnlineUsers
};
