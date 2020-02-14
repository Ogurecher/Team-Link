const got = require('got');
const path = require('path');
const debugModule = require('debug');
const Config = require('../Config');
const { attachCORSHeaders } = require('./headers');
const { refreshAccessToken } = require('./token');

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

async function getGroup ({ displayName, accessToken = config.accessToken } = {}) {
    const groupQuery = `/groups?$filter=startswith(displayName,'${displayName}')&$select=displayName,id`;
    const groupURL = path.join(config.apiBaseURL, groupQuery);

    const groupRes = await got(groupURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(groupRes.body).value[0];
}

async function getChannel ({ group, displayName, accessToken = config.accessToken } = {}) {
    const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, '${displayName}')&select=displayName,id`;
    const channelURL = path.join(config.apiBaseURL, channelQuery);

    const channelRes = await got(channelURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(channelRes.body).value[0];
}

async function getAllUsers ({ group, channel, accessToken = config.accessToken } = {}) {
    const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
    const usersURL = path.join(config.apiBaseURL, usersQuery);

    const usersRes = await got(usersURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(usersRes.body).value.map(data => {
        return {
            displayName: data.displayName,
            id:          data.userId
        };
    });
}

async function getUserInfo ({ user, accessToken = config.accessToken } = {}) {
    const userInfoQuery = `/users/${user.id}/presence`;
    const userInfoURL = path.join(config.apiBaseURL, userInfoQuery);

    const userInfoRes = await got(userInfoURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return {
        displayName: user.displayName,
        id:          user.id,
        status:      JSON.parse(userInfoRes.body).availability
    };
}

async function getOnlineUsers (req, res) {
    res = attachCORSHeaders({ res });

    const accessToken = await refreshAccessToken();

    const group = await getGroup({ displayName: 'dxdeveloper', accessToken });
    const channel = await getChannel({ group, displayName: 'General', accessToken });
    const users = await getAllUsers({ group, channel, accessToken });

    const onlineUsers = [];

    for (const user of users) {
        const userInfo = await getUserInfo({ user, accessToken });

        if (userInfo.status === 'Available')
            onlineUsers.push(userInfo);

    }

    debug(onlineUsers);

    res.send(onlineUsers);
}

module.exports = {
    getOnlineUsers
};
