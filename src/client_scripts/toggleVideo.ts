import { pc } from './setUpMedia';

export async function toggleVideo (): Promise<void> {
    const senders: RTCRtpSender[] = pc.getSenders();

    if (senders[1] !== null) {
        const videoTrack = senders[1].track;

        if (videoTrack !== null) {
            if (videoTrack.enabled === false)
                videoTrack.enabled = true;
            else
                videoTrack.enabled = false;

        }
    }
}
