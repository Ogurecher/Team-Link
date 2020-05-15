import { toggleMedia } from './toggleMedia';

export async function toggleAudio (): Promise<void> {
    toggleMedia('audio');
}
