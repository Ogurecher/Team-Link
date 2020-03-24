import React from 'react';
import ReactDOM from 'react-dom';
import config from './clientConfig';
import { User } from './interfaces';
import UserTable from './components/UserTable';
import CallButton from './components/CallButton';
import CallInfo from './components/CallInfo';

export function renderTable (onlineUsers: User[]): void {
    ReactDOM.render(
        <UserTable tableDOMElementId={config.tableDOMElementId} users={onlineUsers}></UserTable>,
        document.getElementById(config.rootDOMElementId)
    );
}

export function renderButton (): void {
    ReactDOM.render(
        <CallButton callDOMElementId={config.callDOMElementId}></CallButton>,
        document.getElementById(config.callRootDOMElementId)
    );
}

export function renderCallInfo (callId: string): void {
    ReactDOM.render(
        <CallInfo callId={callId} callInfoDOMElementId={config.callInfoDOMElementId}></CallInfo>,
        document.getElementById(config.callInfoRootDOMElementId)
    );
}
