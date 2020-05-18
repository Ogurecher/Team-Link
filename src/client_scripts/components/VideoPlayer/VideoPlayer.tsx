import React, { ReactNode } from 'react';
import ButtonPanel from '../ButtonPanel/ButtonPanel';
import SelfView from '../SelfView/SelfView';
import RemoteView from '../RemoteView/RemoteView';

interface VideoPlayerProps {
    videoPlayerDOMElementId: string;
    selfViewDOMElementId: string;
    remoteViewDOMElementId: string;
    buttonPanelDOMElementId: string;
}

export default class VideoPlayer extends React.Component<VideoPlayerProps> {
    public render (): ReactNode {
        return (
            <div id={this.props.videoPlayerDOMElementId}>
                <SelfView selfViewDOMElementId={this.props.selfViewDOMElementId}></SelfView>
                <RemoteView remoteViewDOMElementId={this.props.remoteViewDOMElementId}></RemoteView>
                <ButtonPanel buttonPanelDOMElementId={this.props.buttonPanelDOMElementId}></ButtonPanel>
            </div>
        );
    }
}
