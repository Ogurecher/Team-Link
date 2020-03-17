import React from 'react';
import UserTableRow from './UserTableRow';
import { User } from '../interfaces';

//const React = window.React;

interface UserTableProps {
    tableDOMElementId: string;
    users: User[];
}

export default class UserTable extends React.Component<UserTableProps> {
    constructor (props: UserTableProps) {
        super(props);
    }

    populateTable () {
        return this.props.users.map((user: User) => {
            return (
                <UserTableRow cellType='td' displayName={user.displayName} id={user.id} status={user.status}></UserTableRow>
            );
        })
    }

    render () {
        return(
            <table id={this.props.tableDOMElementId}>
                <UserTableRow cellType='th' displayName='Display Name' id='ID' status='Status'></UserTableRow>
                {this.populateTable()}
            </table>
        );
    }
}