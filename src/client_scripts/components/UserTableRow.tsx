import React, { ReactNode } from 'react';

interface UserTableRowProps {
    cellType: string;
    displayName: string;
    id: string;
    status: string;
}

export default class UserTableRow extends React.Component<UserTableRowProps> {
    public render (): ReactNode {
        if (this.props.cellType === 'th') {
            return (
                <tr>
                    <th>{this.props.displayName}</th>
                    <th>{this.props.id}</th>
                    <th>{this.props.status}</th>
                </tr>
            );
        }
        return (
            <tr>
                <td>{this.props.displayName}</td>
                <td>{this.props.id}</td>
                <td>{this.props.status}</td>
            </tr>
        );

    }
}
