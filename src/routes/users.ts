import got from 'got';
import path from 'path';
import debugModule from 'debug';
import Config from '../Config';
import { attachCORSHeaders } from './headers';
import { refreshAccessToken } from './token';
import { Group, Channel, User, Presence, HTTPResponse } from '../interfaces';

const configInstance = new Config();
const config = configInstance.config();
const debug = debugModule('team-link:debug');

async function getGroup ({ displayName = '', accessToken = config.accessToken }: { displayName: string; accessToken: string }): Promise<Group> {
    const groupQuery = `/groups?$filter=startswith(displayName,'${displayName}')&$select=displayName,id`;
    const groupURL = path.join(config.apiBaseURL, groupQuery);

    const groupRes = await got(groupURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(groupRes.body).value[0];
}

async function getChannel ({ group, displayName = '', accessToken = config.accessToken }: { group: Group; displayName: string; accessToken: string }): Promise<Channel> {
    const channelQuery = `/teams/${group.id}/channels?$filter=startswith(displayName, '${displayName}')&select=displayName,id`;
    const channelURL = path.join(config.apiBaseURL, channelQuery);

    const channelRes = await got(channelURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(channelRes.body).value[0];
}

async function getAllUsers ({ group, channel, accessToken = config.accessToken }: { group: Group; channel: Channel; accessToken: string }): Promise<User[]> {
    const usersQuery = `/teams/${group.id}/channels/${channel.id}/members`;
    const usersURL = path.join(config.apiBaseURL, usersQuery);

    const usersRes = await got(usersURL, { headers: { Authorization: `Bearer ${accessToken}` } });

    return JSON.parse(usersRes.body).value.map((data: User) => {
        return {
            displayName: data.displayName,
            id:          data.userId
        };
    });
}

async function getPresences ({ idList = [], accessToken = config.accessToken }: { idList: string[]; accessToken: string}): Promise<Presence[]> {
    const presencesQuery = `/communications/getPresencesByUserId`;
    const presencesURL = path.join(config.apiBaseURL, presencesQuery);

    const presencesRes = await got.post(presencesURL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        json: {
            ids: idList
        }
    });

    return JSON.parse(presencesRes.body).value.map((data: Presence) => {
        return {
            id:     data.id,
            status: data.availability
        };
    });
}

export async function getOnlineUsers (req: unknown, res: HTTPResponse): Promise<void> {
    res = attachCORSHeaders({ res });

    const accessToken = await refreshAccessToken();

    const group = config.groupId ? { id: config.groupId } : await getGroup({ displayName: 'dxdeveloper', accessToken });
    const channel = config.channelId ? { id: config.channelId } : await getChannel({ group, displayName: 'General', accessToken });
    const users = await getAllUsers({ group, channel, accessToken });

    const userStatuses = await getPresences({ idList: users.map((data: User) => data.id), accessToken });

    const onlineUsers = [];

    for (const userStatus of userStatuses) {
        const requiredStatus = 'Available';

        if (userStatus.status === requiredStatus) {
            const matchingUser: User | undefined = users.find((user: User) => {
                return user.id === userStatus.id;
            });

            if (matchingUser)
                onlineUsers.push({ ...userStatus, displayName: matchingUser.displayName });
        }
    }

    debug(onlineUsers);

    res.send(onlineUsers);
}
