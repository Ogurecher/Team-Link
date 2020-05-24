import { pc } from './setUpMedia';

export async function toggleMedia (mode: string): Promise<void> {
    let transcieverNumber: number;

    if (mode === 'audio')
        transcieverNumber = 0;
    else if (mode === 'video')
        transcieverNumber = 1;
    else
        return;


    const senders: RTCRtpSender[] = pc.getSenders();

    if (senders[transcieverNumber] !== null) {
        const track = senders[transcieverNumber].track;

        if (track !== null) {
            if (track.enabled === false)
                track.enabled = true;
            else
                track.enabled = false;

        }
    }
}
