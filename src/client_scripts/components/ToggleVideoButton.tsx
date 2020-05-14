import React, { ReactNode } from 'react';
import { toggleVideo } from '../toggleVideo';

export default class ToggleVideoButton extends React.Component {
    public render (): ReactNode {
        return (
            <input type="submit" value="Toggle Video" onClick={toggleVideo}/>
        );
    }
}
