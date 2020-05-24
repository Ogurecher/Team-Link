import React, { ReactNode } from 'react';
import { toggleAudio } from '../toggleAudio';

export default class ToggleAudioButton extends React.Component {
    public render (): ReactNode {
        return (
            <input type="submit" value="Toggle Audio" onClick={toggleAudio}/>
        );
    }
}
