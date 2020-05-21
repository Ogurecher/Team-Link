import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import { fireCreateCallRequest } from '../fireCreateCallRequest';

interface CallButtonProps {
    callDOMElementId: string;
}

export default class CallButton extends React.Component<CallButtonProps> {
    public render (): ReactNode {
        return (
            <ReactBootstrap.Button id={this.props.callDOMElementId} variant="primary" type="submit" onClick={fireCreateCallRequest}>
                <img src="/icons/phone.svg" alt="" width="32" height="32"/>
            </ReactBootstrap.Button>
        );
    }
}
