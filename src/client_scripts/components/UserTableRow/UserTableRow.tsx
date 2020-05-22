import React, { ReactNode } from 'react';
import CallButton from '../CallButton/CallButton';

interface UserTableRowProps {
    cellType: string;
    displayName: string;
    id: string;
    status: string;
    callDOMElementId?: string;
}

export default class UserTableRow extends React.Component<UserTableRowProps> {
    public render (): ReactNode {
        if (this.props.cellType === 'th') {
            return (
                <tr>
                    <th className='display_name_header'>
                        {this.props.displayName}
                        <CallButton callDOMElementId={this.props.callDOMElementId || 'call_button'}></CallButton>
                    </th>
                    <th className='id_header'>{this.props.id}</th>
                    <th className='status_header'>{this.props.status}</th>
                </tr>
            );
        }
        return (
            <tr>
                <td className='display_name_cell'>{this.props.displayName}</td>
                <td className='id_cell'>{this.props.id}</td>
                <td className='status_cell'>{this.props.status}</td>
            </tr>
        );

    }
}
