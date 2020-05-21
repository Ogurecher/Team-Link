import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import { toggleAudio } from '../toggleAudio';

export default class ToggleAudioButton extends React.Component {
    public render (): ReactNode {
        return (
            <ReactBootstrap.ToggleButtonGroup type="checkbox" onChange={toggleAudio}>
                <ReactBootstrap.ToggleButton type="checkbox" value="1">
                    Toggle Audio
                </ReactBootstrap.ToggleButton>
            </ReactBootstrap.ToggleButtonGroup>
        );
    }
}
