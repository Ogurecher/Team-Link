import { toggleMedia } from './toggleMedia';

export async function toggleVideo (): Promise<void> {
    toggleMedia('video');
}
