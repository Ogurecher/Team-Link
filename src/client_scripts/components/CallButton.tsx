import React, { ReactNode } from 'react';
import { fireCreateCallRequest } from '../fireCreateCallRequest';

interface CallButtonProps {
    callDOMElementId: string;
}

export default class CallButton extends React.Component<CallButtonProps> {
    public render (): ReactNode {
        return (
            <input id={this.props.callDOMElementId} type="submit" value="Call" onClick={fireCreateCallRequest}/>
        );
    }
}
