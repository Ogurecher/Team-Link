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
    using NAudio.Wave;
    using Timer = System.Timers.Timer;
    using MediaServer;
    using MediaServer.Converters;
    using MediaServer.Util;
    using MediaServer.Util.HeartBeat;
    using MediaServer.Util.VideoFormat;

    public class CallHandler : HeartbeatHandler
    {
        public const uint DominantSpeakerNone = DominantSpeakerChangedEventArgs.None;

        private const double WaitForMs = 1000 * 60 * 5;

        private DateTime lastVideoSentToClientTimeUtc = DateTime.MinValue;

        private DateTime lastVideoSentToTeamsTimeUtc = DateTime.MinValue;

        private uint subscribedToMsi = DominantSpeakerNone;

        private Participant subscribedToParticipant;

        private int maxIngestFrameCount = 100;

        private Timer endCallTimer;

        private PeerConnection peerConnection;

        private RemoteVideoTrack clientVideoTrack;

        private RemoteAudioTrack clientAudioTrack;

        private Transceiver teamsVideoTransceiver;
        
        private Transceiver teamsAudioTransceiver;
        
        private LocalVideoTrack teamsVideoTrack;
        
        private LocalAudioTrack teamsAudioTrack;

        public CallHandler(ICall statefulCall, PeerConnection peerConnection)
            : base(TimeSpan.FromMinutes(10), statefulCall?.GraphLogger)
        {
            this.Call = statefulCall;
            this.Call.OnUpdated += this.OnCallUpdated;
            if (this.Call.GetLocalMediaSession() != null)
            {
                this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged += this.OnDominantSpeakerChanged;
                this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived += this.OnTeamsVideoReceived;
                this.Call.GetLocalMediaSession().AudioSocket.AudioMediaReceived += this.OnTeamsAudioReceived;
            }

            this.Call.Participants.OnUpdated += this.OnParticipantsUpdated;
            this.endCallTimer = new Timer(CallHandler.WaitForMs);
            this.endCallTimer.Enabled = false;
            this.endCallTimer.AutoReset = false;
            this.endCallTimer.Elapsed += this.OnTimerElapsed;

            this.peerConnection = peerConnection;

            this.peerConnection.VideoTrackAdded += this.OnClientVideoTrackAdded;
            this.peerConnection.VideoTrackRemoved += this.OnClientVideoTrackRemoved;

            this.peerConnection.AudioTrackAdded += this.OnClientAudioTrackAdded;
            this.peerConnection.AudioTrackRemoved += this.OnClientAudioTrackRemoved;

            TransceiverInitSettings transceiverInitSettings = new TransceiverInitSettings();
            transceiverInitSettings.InitialDesiredDirection = Transceiver.Direction.Inactive;
            
            this.teamsAudioTransceiver = this.peerConnection.AddTransceiver(MediaKind.Audio, transceiverInitSettings);
            this.teamsVideoTransceiver = this.peerConnection.AddTransceiver(MediaKind.Video, transceiverInitSettings);
            
            this.teamsVideoTrack = LocalVideoTrack.CreateFromExternalSource("TeamsVideoTrack", ExternalVideoTrackSource.CreateFromI420ACallback(this.CustomI420AFrameCallback));
            this.teamsVideoTransceiver.LocalVideoTrack = this.teamsVideoTrack;

            this.teamsVideoTransceiver.DesiredDirection = Transceiver.Direction.SendReceive;
        }

        public ICall Call { get; }

        protected override Task HeartbeatAsync(ElapsedEventArgs args)
        {
            return this.Call.KeepAliveAsync();
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            this.Call.OnUpdated -= this.OnCallUpdated;
            this.Call.Participants.OnUpdated -= this.OnParticipantsUpdated;

            this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged -= this.OnDominantSpeakerChanged;
            this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived -= this.OnTeamsVideoReceived;
            this.Call.GetLocalMediaSession().AudioSocket.AudioMediaReceived -= this.OnTeamsAudioReceived;
            
            foreach (var participant in this.Call.Participants)
            {
                participant.OnUpdated -= this.OnParticipantUpdated;
            }

            this.endCallTimer.Elapsed -= this.OnTimerElapsed;

            this.peerConnection.VideoTrackAdded -= this.OnClientVideoTrackAdded;
            this.peerConnection.VideoTrackRemoved -= this.OnClientVideoTrackRemoved;

            this.peerConnection.AudioTrackAdded -= this.OnClientAudioTrackAdded;
            this.peerConnection.AudioTrackRemoved -= this.OnClientAudioTrackRemoved;
        }

        private void OnClientVideoTrackAdded(RemoteVideoTrack track)
        {
            this.clientVideoTrack = track;
            this.clientVideoTrack.I420AVideoFrameReady += this.OnClientVideoReceived;
        }

        private void OnClientAudioTrackAdded(RemoteAudioTrack track)
        {
            this.clientAudioTrack = track;
            this.clientAudioTrack.AudioFrameReady += this.OnClientAudioReceived;
        }

        private void OnClientVideoTrackRemoved(Transceiver transceiver, RemoteVideoTrack track)
        {
            this.clientVideoTrack.I420AVideoFrameReady -= this.OnClientVideoReceived;
            this.clientVideoTrack = null;
        }

        private void OnClientAudioTrackRemoved(Transceiver transceiver, RemoteAudioTrack track)
        {
            this.clientAudioTrack.AudioFrameReady -= this.OnClientAudioReceived;
            this.clientAudioTrack = null;
        }


        private void OnClientVideoReceived(I420AVideoFrame frame)
        {
            if (DateTime.Now > this.lastVideoSentToClientTimeUtc + TimeSpan.FromMilliseconds(33))
            {
                this.lastVideoSentToClientTimeUtc = DateTime.Now;

                byte[] i420Frame = new byte[frame.width * frame.height * 12 / 8];
                frame.CopyTo(i420Frame);

                byte[] nv12Frame = VideoConverter.I420ToNV12(i420Frame);

                VideoFormat sendVideoFormat = VideoFormatUtil.GetSendVideoFormat((int)frame.height, (int)frame.width);
                var videoSendBuffer = new VideoSendBuffer(nv12Frame, (uint)nv12Frame.Length, sendVideoFormat);
                this.Call.GetLocalMediaSession().VideoSocket.Send(videoSendBuffer);
            }
        }


        private byte[] savedFrame;

        private int maxAudioFramesToSend = 2;

        private int audioFrameCounter = 0;

        private void OnClientAudioReceived(AudioFrame frame)
        {
            this.audioFrameCounter += 1;
            int outRate = 16000;

            int inputBufferLength = (int)(frame.sampleRate / 100 * frame.bitsPerSample / 8 * frame.channelCount);
            byte[] inputBuffer = new byte[inputBufferLength];
            Marshal.Copy(frame.audioData, inputBuffer, 0, inputBufferLength);

            byte[] pcm16Bytes;

            if (frame.sampleRate != outRate)
            {
                IWaveProvider provider = new RawSourceWaveStream(new MemoryStream(inputBuffer),
                    new WaveFormat((int)frame.sampleRate, (int)frame.bitsPerSample, (int)frame.channelCount));

                var outFormat = new WaveFormat(outRate, provider.WaveFormat.Channels);

                using (var resampler = new MediaFoundationResampler(provider, outFormat))
                {
                    resampler.ResamplerQuality = 1;

                    int wavHeaderSize = 44;
                    int outBufferLength = outFormat.AverageBytesPerSecond / 100;
                    int wavBufferLength = outBufferLength + wavHeaderSize;
                    MemoryStream outStream = new MemoryStream(wavBufferLength);
                    WaveFileWriter.WriteWavFileToStream(outStream, resampler);

                    byte[] wavBytes = outStream.ToArray();
                    ArraySegment<byte> pcm16ArraySegment = new ArraySegment<byte>(wavBytes, wavHeaderSize, outBufferLength);
                    pcm16Bytes = pcm16ArraySegment.ToArray();
                }
            }
            else
            {
                pcm16Bytes = inputBuffer;
            }

            if (this.audioFrameCounter % this.maxAudioFramesToSend == 0)
            {
                byte[] stackedFrames = new byte[savedFrame.Length + pcm16Bytes.Length];
                savedFrame.CopyTo(stackedFrames, 0);
                pcm16Bytes.CopyTo(stackedFrames, savedFrame.Length);

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

        private void CustomAudioFrameCallback(in AudioFrameRequest request)
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

        private void CustomI420AFrameCallback(in FrameRequest request)
        {
            if (this.nv12VideoFrameToSend != null)
            {
                byte[] i420Frame = VideoConverter.NV12ToI420(this.nv12VideoFrameToSend);
                
                IntPtr dataY = Marshal.AllocHGlobal(i420Frame.Length);
                Marshal.Copy(i420Frame, 0, dataY, i420Frame.Length);

                int pixelCount = this.nv12VideoFrameToSend.Length * 8 / 12;
                double aspectRatio = 0.5625;
                int frameWidth = (int)Math.Sqrt(pixelCount / aspectRatio);
                int frameHeight = pixelCount / frameWidth;
                
                var frame = new I420AVideoFrame
                {
                    dataY = dataY,
                    dataU = dataY + pixelCount,
                    dataV = dataY + pixelCount / 4 * 5,
                    dataA = IntPtr.Zero,
                    strideY = frameWidth,
                    strideU = frameWidth / 2,
                    strideV = frameWidth / 2,
                    strideA = 0,
                    width = (uint)frameWidth,
                    height = (uint)frameHeight
                };
                request.CompleteRequest(frame);
                
                Marshal.FreeHGlobal(dataY);
            }
        }
        
        private void OnCallUpdated(ICall sender, ResourceEventArgs<Call> args)
        {
            this.Subscribe();
        }

        private void OnParticipantsUpdated(IParticipantCollection sender, CollectionEventArgs<IParticipant> args)
        {
            foreach (var participant in args.AddedResources)
            {
                participant.OnUpdated += this.OnParticipantUpdated;
            }

            foreach (var participant in args.RemovedResources)
            {
                participant.OnUpdated -= this.OnParticipantUpdated;
            }

            bool nonBotParticipants = false;
            foreach (var participant in sender)
            {
                var isBot = participant.Resource.Info.Identity.Application != null;
                if (!isBot)
                {
                    nonBotParticipants = true;
                    break;
                }
            }

            if (nonBotParticipants)
            {
                this.endCallTimer.Stop();
            }
            else
            {
                this.endCallTimer.Start();
            }

            this.Subscribe();
        }

        private void OnTimerElapsed(object sender, ElapsedEventArgs args)
        {
            _ = this.Call.DeleteAsync().ForgetAndLogExceptionAsync(this.Call.GraphLogger);
        }

        private void OnParticipantUpdated(IParticipant sender, ResourceEventArgs<Participant> args)
        {
            this.Subscribe();
        }

        private void OnDominantSpeakerChanged(object sender, DominantSpeakerChangedEventArgs e)
        {
            Console.WriteLine("DOMINANT SPEAKER CHANGED");
            this.GraphLogger.Info($"[{this.Call.Id}:OnDominantSpeakerChanged(DominantSpeaker={e.CurrentDominantSpeaker})]");

            this.subscribedToMsi = e.CurrentDominantSpeaker;

            this.Subscribe(e.CurrentDominantSpeaker);
        }


        private byte[] nv12VideoFrameToSend;

        private void OnTeamsVideoReceived(object sender, VideoMediaReceivedEventArgs e)
        {
            Console.WriteLine("MEDIA RECEIVED");
            try
            {
                if (Interlocked.Decrement(ref this.maxIngestFrameCount) > 0)
                {
                    this.GraphLogger.Info(
                        $"[{this.Call.Id}]: Capturing image: [VideoMediaReceivedEventArgs(Data=<{e.Buffer.Data.ToString()}>, " +
                        $"Length={e.Buffer.Length}, Timestamp={e.Buffer.Timestamp}, Width={e.Buffer.VideoFormat.Width}, " +
                        $"Height={e.Buffer.VideoFormat.Height}, ColorFormat={e.Buffer.VideoFormat.VideoColorFormat}, FrameRate={e.Buffer.VideoFormat.FrameRate})]");
                }

                if (DateTime.Now > this.lastVideoSentToTeamsTimeUtc + TimeSpan.FromMilliseconds(33))
                {
                    this.lastVideoSentToTeamsTimeUtc = DateTime.Now;

                    byte[] buffer = new byte[e.Buffer.VideoFormat.Width * e.Buffer.VideoFormat.Height * 12 / 8];
                    Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                    this.nv12VideoFrameToSend = buffer;
                }
            }
            catch (Exception ex)
            {
                this.GraphLogger.Error(ex, $"[{this.Call.Id}] Exception in VideoMediaReceived");
            }

            e.Buffer.Dispose();
        }

        private byte[] audioFrameToSend;

        private void OnTeamsAudioReceived(object sender, AudioMediaReceivedEventArgs e)
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
                this.GraphLogger.Error(ex, $"[{this.Call.Id}] Exception in AudioMediaReceived");
            }

            e.Buffer.Dispose();
        }

        private void Subscribe(uint msi)
        {
            if (this.Call.Resource.State != CallState.Established)
            {
                Console.WriteLine("TRIED TO SUBSCRIBE BUT CALL NOT ESTABLISHED");
                return;
            }

            Console.WriteLine("SUBSCRIBE");

            try
            {
                this.GraphLogger.Info($"[{this.Call.Id}] Received subscribe request for Msi {msi}");

                IParticipant participant = this.GetParticipantForParticipantsChange(msi);
                if (participant == null)
                {
                    this.subscribedToParticipant = null;

                    this.GraphLogger.Info($"[{this.Call.Id}] Could not find valid participant using MSI {msi}");

                    return;
                }

                if (this.subscribedToParticipant?.Id.Equals(participant.Id, StringComparison.OrdinalIgnoreCase) == true)
                {
                    this.GraphLogger.Info($"[{this.Call.Id}] Already subscribed to {participant.Id}. So skipping subscription");
                }
                else
                {
                    this.GraphLogger.Info($"[{this.Call.Id}] Subscribing to {participant.Id} using MSI {msi}");
                }

                if (uint.TryParse(participant.Resource.MediaStreams.FirstOrDefault(m => m.MediaType == Modality.Video)?.SourceId, out msi))
                {
                    this.Call.GetLocalMediaSession().VideoSocket.Subscribe(VideoResolution.SD360p, msi);
                }

                this.subscribedToParticipant = participant.Resource;
            }
            catch (Exception ex)
            {
                this.GraphLogger.Error(ex, $"[{this.Call.Id}] Subscribe threw exception");
            }
        }

        private void Subscribe()
        {
            uint prevSubscribedMsi = this.subscribedToMsi;
            this.GraphLogger.Info($"[{this.Call.Id}] Subscribing to: {prevSubscribedMsi}");

            this.Subscribe(prevSubscribedMsi);
        }

        private IParticipant GetParticipantForParticipantsChange(uint dominantSpeakerMsi)
        {
            if (this.Call.Participants.Count < 1)
            {
                this.GraphLogger.Warn($"[{this.Call.Id}] Did not receive rosterupdate notification yet");
                return null;
            }

            IParticipant firstParticipant = null;
            foreach (var participant in this.Call.Participants)
            {
                var audioStream = participant.Resource.MediaStreams.FirstOrDefault(stream => stream.MediaType == Modality.Audio);
                if (audioStream == null)
                {
                    continue;
                }

                var videoStream = participant.Resource.MediaStreams.FirstOrDefault(stream =>
                {
                    var isVideo = stream.MediaType == Modality.Video;
                    var isSending = stream.Direction == MediaDirection.SendOnly || stream.Direction == MediaDirection.SendReceive;
                    return isVideo && isSending;
                });
                if (videoStream == null)
                {
                    continue;
                }

                if (dominantSpeakerMsi.ToString().Equals(audioStream.SourceId, StringComparison.OrdinalIgnoreCase))
                {
                    return participant;
                }

                if (firstParticipant == null ||
                    this.subscribedToParticipant?.Id.Equals(participant.Id, StringComparison.OrdinalIgnoreCase) == true)
                {
                    firstParticipant = participant;
                }
            }

            return firstParticipant;
        }
    }
}
