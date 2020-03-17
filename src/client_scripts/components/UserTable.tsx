import React, { ReactNode } from 'react';
import UserTableRow from './UserTableRow';
import { User } from '../interfaces';

interface UserTableProps {
    tableDOMElementId: string;
    users: User[];
}

export default class UserTable extends React.Component<UserTableProps> {
    private populateTable (): JSX.Element[] {
        return this.props.users.map((user: User, index) => {
            return (
                <UserTableRow key={index} cellType='td' displayName={user.displayName} id={user.id} status={user.status}></UserTableRow>
            );
        });
    }

    public render (): ReactNode {
        return (
            <table id={this.props.tableDOMElementId}>
                <tbody>
                    <UserTableRow key='-1' cellType='th' displayName='Display Name' id='ID' status='Status'></UserTableRow>
                    {this.populateTable()}
                </tbody>
            </table>
        );
    }
}
