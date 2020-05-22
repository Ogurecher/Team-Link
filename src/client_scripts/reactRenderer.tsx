import React from 'react';
import ReactDOM from 'react-dom';
import config from './clientConfig';
import { User } from './interfaces';
import UserTable from './components/UserTable/UserTable';
import CallInfo from './components/CallInfo/CallInfo';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

export function renderTable (onlineUsers: User[]): void {
    ReactDOM.render(
        <UserTable tableDOMElementId={config.tableDOMElementId} users={onlineUsers} callDOMElementId={config.callDOMElementId}></UserTable>,
        document.getElementById(config.rootDOMElementId)
    );
}

export function renderCallInfo (callId: string): void {
    ReactDOM.render(
        <CallInfo callId={callId} callInfoDOMElementId={config.callInfoDOMElementId}></CallInfo>,
        document.getElementById(config.callInfoRootDOMElementId)
    );
}

export function renderVideoPlayer (): void {
    ReactDOM.render(
        <VideoPlayer videoPlayerDOMElementId={config.videoPlayerDOMElementId} selfViewDOMElementId={config.selfViewDOMElementId} remoteViewDOMElementId={config.remoteViewDOMElementId} buttonPanelDOMElementId={config.buttonPanelDOMElementId}></VideoPlayer>,
        document.getElementById(config.videoPlayerRootDOMElementId)
    );
}
