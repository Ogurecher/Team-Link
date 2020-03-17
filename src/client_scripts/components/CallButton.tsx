import React from 'react';
//const React = window.React;

export default class CallButton extends React.Component {
    render () {
        return (
            <input id="call_button" type="submit" value="Call" data-onclick="fireCreateCallRequest()"/>
        );
    }
}