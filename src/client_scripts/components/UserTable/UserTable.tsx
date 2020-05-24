import React, { ReactNode } from 'react';
import ReactBootstrap from 'react-bootstrap';
import UserTableRow from '../UserTableRow/UserTableRow';
import { User } from '../../interfaces';

interface UserTableProps {
    tableDOMElementId: string;
    users: User[];
    callDOMElementId: string;
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
            <ReactBootstrap.Table striped bordered hover size="sm" id={this.props.tableDOMElementId} >
                <tbody>
                    <UserTableRow key='-1' cellType='th' displayName='Display Name' id='ID' status='Status' callDOMElementId={this.props.callDOMElementId}></UserTableRow>
                    {this.populateTable()}
                </tbody>
            </ReactBootstrap.Table>
        );
    }
}
