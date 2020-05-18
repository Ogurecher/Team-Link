import React, { ReactNode } from 'react';
import ToggleAudioButton from '../ToggleAudioButton';
import ToggleVideoButton from '../ToggleVideoButton';
import HangUpButton from '../HangUpButton';

interface ButtonPanelProps {
    buttonPanelDOMElementId: string;
}

export default class ButtonPanel extends React.Component<ButtonPanelProps> {
    public render (): ReactNode {
        return (
            <div id={this.props.buttonPanelDOMElementId}>
                <ToggleAudioButton></ToggleAudioButton>
                <ToggleVideoButton></ToggleVideoButton>
                <HangUpButton></HangUpButton>
            </div>
        );
    }
}
