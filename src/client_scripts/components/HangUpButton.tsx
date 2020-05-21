import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import { hangUpCall } from '../hangUpCall';


export default class CallButton extends React.Component {
    public render (): ReactNode {
        return (
            <ReactBootstrap.Button variant="primary" type="submit" onClick={hangUpCall}>
                <img src="/icons/hang-up.svg" alt="" width="32" height="32"/>
            </ReactBootstrap.Button>
        );
    }
}
