import React, { ReactNode } from 'react';
import ToggleAudioButton from '../ToggleAudioButton/ToggleAudioButton';
import ToggleVideoButton from '../ToggleVideoButton/ToggleVideoButton';
import HangUpButton from '../HangUpButton/HangUpButton';

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
