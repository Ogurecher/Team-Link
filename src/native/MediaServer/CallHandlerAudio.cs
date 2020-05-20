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
    using MediaServer.Util;

    public class CallHandlerAudio
    {

        public RemoteAudioTrack clientAudioTrack;

        private FixedSizeQueue<byte[]> audioFrameQueue = new FixedSizeQueue<byte[]>(Config.AudioSettings.MAX_AUDIO_FRAMES_IN_QUEUE);

        private byte[] savedFrame;

        private int maxAudioFramesToSend = Config.AudioSettings.MAX_FRAMES_TO_SEND;

        private int audioFrameCounter = 0;

        private DateTime lastAudioGotFromTeamsTimeUtc = DateTime.MinValue;

        private DateTime lastAudioSentToClientTimeUtc = DateTime.MinValue;

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
            if (DateTime.Now > this.lastAudioSentToClientTimeUtc + TimeSpan.FromMilliseconds(8))
            {
                this.lastAudioSentToClientTimeUtc = DateTime.Now;

                if (this.audioFrameQueue.Count > 0)
                {
                    byte[] pcm16AudioFrame = this.audioFrameQueue.Dequeue();

                    byte[] audioFrameToSend = AudioConverter.ResampleAudio(pcm16AudioFrame, Config.AudioSettings.OUTGOING_SAMPLE_RATE,
                        Config.AudioSettings.OUTGOING_BITS_PER_SAMPLE, Config.AudioSettings.OUTGOING_CHANNEL_COUNT, Config.AudioSettings.WEBRTC_SAMPLE_RATE);

                    IntPtr framePointer = Marshal.AllocHGlobal(audioFrameToSend.Length);
                    Marshal.Copy(audioFrameToSend, 0, framePointer, audioFrameToSend.Length);

                    var frame = new AudioFrame
                        {
                            audioData = framePointer,
                            bitsPerSample = Config.AudioSettings.OUTGOING_BITS_PER_SAMPLE,
                            sampleRate = Config.AudioSettings.WEBRTC_SAMPLE_RATE,
                            channelCount = Config.AudioSettings.OUTGOING_CHANNEL_COUNT,
                            sampleCount = (uint)audioFrameToSend.Length * 8 / Config.AudioSettings.OUTGOING_BITS_PER_SAMPLE
                        };
                    request.CompleteRequest(frame);

                    Marshal.FreeHGlobal(framePointer);
                }
            }
        }

        public void OnTeamsAudioReceived(object sender, AudioMediaReceivedEventArgs e)
        {
            if (DateTime.Now > this.lastAudioGotFromTeamsTimeUtc + TimeSpan.FromMilliseconds(20))
            {
                this.lastAudioGotFromTeamsTimeUtc = DateTime.Now;
                Console.WriteLine("Audio MEDIA RECEIVED");
                try
                {
                    byte[][] pcm16Frames = new byte[][]
                    {
                        new byte[e.Buffer.Length / 2],
                        new byte[e.Buffer.Length / 2]
                    };
                    
                    byte[] buffer = new byte[e.Buffer.Length];
                    Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                    for (int i = 0; i < 2; i++)
                    {
                        Array.Copy(buffer, i * pcm16Frames[i].Length, pcm16Frames[i], 0, pcm16Frames[i].Length);
                        this.audioFrameQueue.Enqueue(pcm16Frames[i]);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }

                e.Buffer.Dispose();
            }
        }
    }
}
