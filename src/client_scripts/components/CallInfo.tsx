import React, { ReactNode } from 'react';

interface CallInfoProps {
    callId: string;
}

export default class CallInfo extends React.Component<CallInfoProps> {
    public render (): ReactNode {
        return (
            <p>
                callId: {this.props.callId}
            </p>
        );
    }
}
