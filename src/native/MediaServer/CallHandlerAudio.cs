namespace MediaServer.MediaBot
{
    using System;
    using System.Collections.Generic;
    using System.Runtime.InteropServices;
    using Microsoft.Graph.Communications.Calls;
    using Microsoft.Graph.Communications.Calls.Media;
    using Microsoft.Skype.Bots.Media;
    using Microsoft.MixedReality.WebRTC;
    using MediaServer;
    using MediaServer.Converters;

    public class CallHandlerAudio
    {

        public RemoteAudioTrack clientAudioTrack;

        private Queue<byte[]> audioFrameQueue = new Queue<byte[]>();

        private byte[] savedFrame;

        private int maxAudioFramesToSend = Config.AudioSettings.MAX_FRAMES_TO_SEND;

        private int audioFrameCounter = 0;

        private ICall Call;

        public CallHandlerAudio(ICall call)
        {
            this.Call = call;
        }

        public void OnClientAudioTrackAdded(RemoteAudioTrack track)
        {
            this.clientAudioTrack = track;
            this.clientAudioTrack.AudioFrameReady += this.OnClientAudioReceived;
        }

        public void OnClientAudioTrackRemoved(Transceiver transceiver, RemoteAudioTrack track)
        {
            this.clientAudioTrack.AudioFrameReady -= this.OnClientAudioReceived;
            this.clientAudioTrack = null;
        }

        public void OnClientAudioReceived(AudioFrame frame)
        {
            this.audioFrameCounter += 1;

            int inputBufferLength = (int)(frame.sampleRate / 100 * frame.bitsPerSample / 8 * frame.channelCount);
            byte[] inputBuffer = new byte[inputBufferLength];
            Marshal.Copy(frame.audioData, inputBuffer, 0, inputBufferLength);

            byte[] pcm16Bytes = AudioConverter.ResampleAudio(inputBuffer, (int)frame.sampleRate,
                (int)frame.bitsPerSample, (int)frame.channelCount, Config.AudioSettings.OUTGOING_SAMPLE_RATE);

            if (this.audioFrameCounter % this.maxAudioFramesToSend == 0)
            {
                try
                {
                    byte[] stackedFrames = AudioConverter.MergeFrames(this.savedFrame, pcm16Bytes);

                    IntPtr pcm16Pointer = Marshal.AllocHGlobal(stackedFrames.Length);
                    Marshal.Copy(stackedFrames, 0, pcm16Pointer, stackedFrames.Length);

                    var audioSendBuffer = new AudioSendBuffer(pcm16Pointer, (long)stackedFrames.Length, AudioFormat.Pcm16K);
                    this.Call.GetLocalMediaSession().AudioSocket.Send(audioSendBuffer);
                }
                catch(Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
            else
            {
                this.savedFrame = pcm16Bytes;
            }
        }

        public void CustomAudioFrameCallback(in AudioFrameRequest request)
        {
            byte[] audioFrameToSend = this.audioFrameQueue.Dequeue();

            IntPtr framePointer = Marshal.AllocHGlobal(audioFrameToSend.Length);
            Marshal.Copy(audioFrameToSend, 0, framePointer, audioFrameToSend.Length);

            var frame = new AudioFrame
                {
                    audioData = framePointer,
                    bitsPerSample = Config.AudioSettings.OUTGOING_BITS_PER_SAMPLE,
                    sampleRate = Config.AudioSettings.OUTGOING_SAMPLE_RATE,
                    channelCount = Config.AudioSettings.OUTGOING_CHANNEL_COUNT,
                    sampleCount = (uint)audioFrameToSend.Length * 8 / Config.AudioSettings.OUTGOING_BITS_PER_SAMPLE
                };
            request.CompleteRequest(frame);

            Marshal.FreeHGlobal(framePointer);
        }

        public void OnTeamsAudioReceived(object sender, AudioMediaReceivedEventArgs e)
        {
            Console.WriteLine("Audio MEDIA RECEIVED");
            try
            {
                IntPtr secondFramePointer = e.Buffer.Data + (int)(e.Buffer.Length / 2);
                byte[] buffer = new byte[e.Buffer.Length / 2]; // change to real length later
                Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                this.audioFrameQueue.Enqueue(buffer);

                Marshal.Copy(secondFramePointer, buffer, 0, buffer.Length);

                this.audioFrameQueue.Enqueue(buffer);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            e.Buffer.Dispose();
        }
    }
}
