import React from 'react';

interface CallInfoProps {
    callId: string;
}

export default class CallInfo extends React.Component<CallInfoProps> {
    render () {
        return (
            <p>
                callId: {this.props.callId}
            </p>
        );
    }
}