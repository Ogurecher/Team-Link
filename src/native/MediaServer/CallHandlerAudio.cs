namespace MediaServer.MediaBot
{
    using System;
    using System.Collections.Generic;
    using System.Drawing;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using System.Timers;
    using Microsoft.Graph;
    using Microsoft.Graph.Communications.Calls;
    using Microsoft.Graph.Communications.Calls.Media;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Microsoft.Graph.Communications.Resources;
    using Microsoft.Skype.Bots.Media;
    using Microsoft.MixedReality.WebRTC;
    using Timer = System.Timers.Timer;
    using MediaServer;
    using MediaServer.Converters;
    using MediaServer.Util;

    public class CallHandlerAudio
    {

        private RemoteAudioTrack clientAudioTrack;

        private byte[] audioFrameToSend;

        private byte[] savedFrame;

        private int maxAudioFramesToSend = 2;

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
            int outRate = 16000;

            int inputBufferLength = (int)(frame.sampleRate / 100 * frame.bitsPerSample / 8 * frame.channelCount);
            byte[] inputBuffer = new byte[inputBufferLength];
            Marshal.Copy(frame.audioData, inputBuffer, 0, inputBufferLength);

            byte[] pcm16Bytes = AudioConverter.ResampleAudio(inputBuffer, (int)frame.sampleRate, (int)frame.bitsPerSample, (int)frame.channelCount, outRate);

            if (this.audioFrameCounter % this.maxAudioFramesToSend == 0)
            {
                byte[] stackedFrames = AudioConverter.MergeFrames(this.savedFrame, pcm16Bytes);

                IntPtr pcm16Pointer = Marshal.AllocHGlobal(stackedFrames.Length);
                Marshal.Copy(stackedFrames, 0, pcm16Pointer, stackedFrames.Length);

                var audioSendBuffer = new AudioSendBuffer(pcm16Pointer, (long)stackedFrames.Length, AudioFormat.Pcm16K);
                this.Call.GetLocalMediaSession().AudioSocket.Send(audioSendBuffer);
            }
            else
            {
                this.savedFrame = pcm16Bytes;
            }
        }

        public void CustomAudioFrameCallback(in AudioFrameRequest request)
        {
            IntPtr framePointer = Marshal.AllocHGlobal(this.audioFrameToSend.Length);
            Marshal.Copy(this.audioFrameToSend, 0, framePointer, this.audioFrameToSend.Length);

            var frame = new AudioFrame
                {
                    audioData = framePointer,
                    bitsPerSample = 16,
                    sampleRate = 16000,
                    channelCount = 1,
                    sampleCount = (uint)this.audioFrameToSend.Length * 8 / 16
                };
            request.CompleteRequest(frame);

            Marshal.FreeHGlobal(framePointer);
        }

        public void OnTeamsAudioReceived(object sender, AudioMediaReceivedEventArgs e)
        {
            Console.WriteLine("Audio MEDIA RECEIVED");
            try
            {
                byte[] buffer = new byte[100]; // change to real length later
                Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                this.audioFrameToSend = buffer;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            e.Buffer.Dispose();
        }
    }
}
