import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import { toggleAudio } from '../toggleAudio';

export default class ToggleAudioButton extends React.Component {
    public render (): ReactNode {
        return (
            <ReactBootstrap.ToggleButtonGroup type="checkbox" onChange={toggleAudio}>
                <ReactBootstrap.ToggleButton type="checkbox" value="1">
                    <img src="/icons/mic-fill.svg" alt="" width="32" height="32"/>
                </ReactBootstrap.ToggleButton>
            </ReactBootstrap.ToggleButtonGroup>
        );
    }
}
