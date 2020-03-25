import React, { ReactNode } from 'react';
import { hangUpCall } from '../hangUpCall';


export default class CallButton extends React.Component {
    public render (): ReactNode {
        return (
            <input type="submit" value="Hang Up" onClick={hangUpCall}/>
        );
    }
}
