import React, { ReactNode } from 'react';
import ToggleAudioButton from './ToggleAudioButton';
import ToggleVideoButton from './ToggleVideoButton';
import SelfView from './SelfView';
import RemoteView from './RemoteView';

interface VideoPlayerProps {
    videoPlayerDOMElementId: string;
    selfViewDOMElementId: string;
    remoteViewDOMElementId: string;
}

export default class VideoPlayer extends React.Component<VideoPlayerProps> {
    public render (): ReactNode {
        return (
            <div id={this.props.videoPlayerDOMElementId}>
                <SelfView selfViewDOMElementId={this.props.selfViewDOMElementId}></SelfView>
                <RemoteView remoteViewDOMElementId={this.props.remoteViewDOMElementId}></RemoteView>
                <ToggleAudioButton></ToggleAudioButton>
                <ToggleVideoButton></ToggleVideoButton>
            </div>
        );
    }
}
