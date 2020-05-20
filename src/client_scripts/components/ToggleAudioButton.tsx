import React, { ReactNode } from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { toggleAudio } from '../toggleAudio';

export default class ToggleAudioButton extends React.Component {
    public render (): ReactNode {
        return (
            <ToggleButton type="checkbox" defaultChecked value="1" onChange={toggleAudio}>
                Toggle Audio
            </ToggleButton>
        );
    }
}
