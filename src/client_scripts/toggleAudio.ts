import { pc } from './setUpMedia';

export async function toggleAudio (): Promise<void> {
    const senders: RTCRtpSender[] = pc.getSenders();

    if (senders[0] !== null) {
        const audioTrack = senders[0].track;

        if (audioTrack !== null) {
            if (audioTrack.enabled === false)
                audioTrack.enabled = true;
            else
                audioTrack.enabled = false;

        }
    }
}
