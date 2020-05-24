import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import { toggleVideo } from '../../toggleVideo';

export default class ToggleVideoButton extends React.Component {
    public render (): ReactNode {
        return (
            <ReactBootstrap.ToggleButtonGroup type="checkbox" onChange={toggleVideo}>
                <ReactBootstrap.ToggleButton type="checkbox" value="1">
                    <img src="/icons/camera-video-fill.svg" alt="" width="32" height="32"/>
                </ReactBootstrap.ToggleButton>
            </ReactBootstrap.ToggleButtonGroup>
        );
    }
}
