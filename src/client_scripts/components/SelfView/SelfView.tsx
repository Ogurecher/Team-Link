import React, { ReactNode } from 'react';

interface SelfViewProps {
    selfViewDOMElementId: string;
}

export default class SelfView extends React.Component<SelfViewProps> {
    public render (): ReactNode {
        return (
            <video id={this.props.selfViewDOMElementId} autoPlay></video>
        );
    }
}
