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
        <CallButton></CallButton>,
        document.getElementById(config.callDOMElementId)
    );
}

export function renderCallInfo (callId: string): void {
    ReactDOM.render(
        <CallInfo callId={callId}></CallInfo>,
        document.getElementById(config.callInfoDOMElementId)
    );
}
