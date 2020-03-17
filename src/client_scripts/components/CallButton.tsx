import React, { ReactNode } from 'react';

export default class CallButton extends React.Component {
    public render (): ReactNode {
        return (
            <input id="call_button" type="submit" value="Call" onclick="fireCreateCallRequest()"/>
        );
    }
}
