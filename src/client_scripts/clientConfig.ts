export default {
    pollingInterval:             5000,
    usersEndpoint:               'users',
    callEndpoint:                'call',
    hangUpEndpoint:              'hangUp',
    rootDOMElementId:            'root',
    tableDOMElementId:           'available_users',
    callDOMElementId:            'call_button',
    callRootDOMElementId:        'call_button_root',
    callInfoDOMElementId:        'call_info',
    callInfoRootDOMElementId:    'call_info_root',
    videoPlayerDOMElementId:     'video_player',
    videoPlayerRootDOMElementId: 'video_player_root',
    buttonPanelDOMElementId: 'button_panel',
    selfViewDOMElementId:        'self_view',
    remoteViewDOMElementId:      'remote_view',
    stunURL:                     'stun:stun.l.google.com:19302',
    websocketURL:                'wss://teamlink_media.ngrok.io/websocket',
    audioConstraints:            {
        sampleRate: 16000
    },
    videoConstraints: {
        width:  640,
        height: 360
    }
};
