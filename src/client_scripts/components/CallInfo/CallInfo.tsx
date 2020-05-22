import React, { ReactNode } from 'react';

interface CallInfoProps {
    callId: string;
    callInfoDOMElementId: string;
}

export default class CallInfo extends React.Component<CallInfoProps> {
    public render (): ReactNode {
        return (
            <p id={this.props.callInfoDOMElementId}>
                callId: {this.props.callId}
            </p>
        );
    }
}
