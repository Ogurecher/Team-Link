import React from 'react';
import ReactDOM from 'react-dom';
import config from './clientConfig';
import { User } from './interfaces';
import UserTable from './components/UserTable';
import CallButton from './components/CallButton';
import CallInfo from './components/CallInfo';

/*interface Window {
    React: any;
}

const React = window.React;*/

export function renderTable (onlineUsers: User[]) {
    ReactDOM.render(
        <UserTable tableDOMElementId={config.tableDOMElementId} users={onlineUsers}></UserTable>,
        document.getElementById(config.rootDOMElementId)
    )
}

export function renderButton () {
    ReactDOM.render(
        <CallButton></CallButton>,
        document.getElementById(config.rootDOMElementId)
    )
}

export function renderCallInfo (callId: string) {
    ReactDOM.render(
        <CallInfo callId={callId}></CallInfo>,
        document.getElementById(config.rootDOMElementId)
    )
}