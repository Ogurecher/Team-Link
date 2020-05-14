import config from './clientConfig';

export let pc: RTCPeerConnection;

export async function setUpMedia (): Promise<void> {
    const selfView = document.getElementById(config.selfViewDOMElementId) as HTMLVideoElement;
    const remoteView = document.getElementById(config.remoteViewDOMElementId) as HTMLVideoElement;

    const remoteStream = new MediaStream();

    const constraints = {
        audio: config.audioConstraints,
        video: config.videoConstraints
    };

    const signaling = new WebSocket(config.websocketURL);
    const configuration = { iceServers: [{ urls: config.stunURL }] };

    pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = ({ candidate }) => signaling.send(JSON.stringify(candidate));

    pc.onnegotiationneeded = async () => {
        await pc.setLocalDescription(await pc.createOffer());
        signaling.send(JSON.stringify(pc.localDescription));
    };

    pc.ontrack = event => {
        remoteStream.addTrack(event.track);
        remoteView.srcObject = remoteStream;
    };

    signaling.onmessage = async event => {
        const data = JSON.parse(event.data);

        if (data.type) {
            if (data.type === 'offer') {
                await pc.setRemoteDescription(data);
                await pc.setLocalDescription(await pc.createAnswer());

                signaling.send(JSON.stringify(pc.localDescription));
            }
            else if (data.type === 'answer')
                await pc.setRemoteDescription(data);
            else
                throw Error('Unsupported SDP type.');

        }
        else if (data.candidate)
            await pc.addIceCandidate(data);

    };

    const start = async (): Promise<void> => {
        if (navigator.mediaDevices) {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            selfView.srcObject = stream;
        }
    };

    start();
}
