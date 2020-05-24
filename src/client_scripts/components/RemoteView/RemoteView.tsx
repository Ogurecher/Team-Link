import React, { ReactNode } from 'react';

interface RemoteViewProps {
    remoteViewDOMElementId: string;
}

export default class RemoteView extends React.Component<RemoteViewProps> {
    public render (): ReactNode {
        return (
            <video id={this.props.remoteViewDOMElementId} autoPlay></video>
        );
    }
}
