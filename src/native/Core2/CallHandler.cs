namespace MediaServer.MediaBot
{
    using System;
    using System.Collections.Generic;
    using System.Drawing;
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
    using MediaServer.Util;
    using MediaServer.Util.HeartBeat;
    using MediaServer.Util.VideoFormat;

    public class CallHandler : HeartbeatHandler
    {
        public const uint DominantSpeakerNone = DominantSpeakerChangedEventArgs.None;

        /// <summary>
        /// How long the timer should wait before ending the call.
        /// </summary>
        private const double WaitForMs = 1000 * 60 * 5;

        /// <summary>
        /// The time between each video frame capturing.
        /// </summary>
        private readonly TimeSpan videoCaptureFrequency = TimeSpan.FromMilliseconds(2000);

        /// <summary>
        /// The time stamp when video image was updated last.
        /// </summary>
        private DateTime lastVideoCapturedTimeUtc = DateTime.MinValue;

        /// <summary>
        /// The time stamp when video was sent last.
        /// </summary>
        private DateTime lastVideoSentTimeUtc = DateTime.MinValue;

        /// <summary>
        /// The MediaStreamId of the last dominant speaker.
        /// </summary>
        private uint subscribedToMsi = DominantSpeakerNone;

        /// <summary>
        /// The MediaStreamId of the participant to which the video channel is currently subscribed to.
        /// </summary>
        private Participant subscribedToParticipant;

        /// <summary>
        /// Count of incoming messages to log.
        /// </summary>
        private int maxIngestFrameCount = 100;

        /// <summary>
        /// The Timer to end the call.
        /// </summary>
        private Timer endCallTimer;

        private PeerConnection peerConnection;

        /// <summary>
        /// Initializes a new instance of the <see cref="CallHandler"/> class.
        /// </summary>
        /// <param name="statefulCall">Stateful call instance.</param>
        public CallHandler(ICall statefulCall, PeerConnection peerConnection)
            : base(TimeSpan.FromMinutes(10), statefulCall?.GraphLogger)
        {
            this.Call = statefulCall;
            this.Call.OnUpdated += this.OnCallUpdated;
            if (this.Call.GetLocalMediaSession() != null)
            {
                this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged += this.OnDominantSpeakerChanged;
                this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived += this.OnVideoMediaReceived;
            }

            this.Call.Participants.OnUpdated += this.OnParticipantsUpdated;
            this.endCallTimer = new Timer(CallHandler.WaitForMs);
            this.endCallTimer.Enabled = false;
            this.endCallTimer.AutoReset = false;
            this.endCallTimer.Elapsed += this.OnTimerElapsed;

            this.peerConnection = peerConnection;
            this.peerConnection.I420RemoteVideoFrameReady += this.OnLocalMediaReceived;
        }

        /// <summary>
        /// Gets the call object.
        /// </summary>
        public ICall Call { get; }

        /// <inheritdoc/>
        protected override Task HeartbeatAsync(ElapsedEventArgs args)
        {
            return this.Call.KeepAliveAsync();
        }

        /// <inheritdoc />
        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            this.Call.OnUpdated -= this.OnCallUpdated;
            this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged -= this.OnDominantSpeakerChanged;
            this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived -= this.OnVideoMediaReceived;
            this.Call.Participants.OnUpdated -= this.OnParticipantsUpdated;
            foreach (var participant in this.Call.Participants)
            {
                participant.OnUpdated -= this.OnParticipantUpdated;
            }

            this.endCallTimer.Elapsed -= this.OnTimerElapsed;
        }


        private void OnLocalMediaReceived(I420AVideoFrame frame)
        {
            if (DateTime.Now > this.lastVideoSentTimeUtc + TimeSpan.FromMilliseconds(33))
            {
                this.lastVideoSentTimeUtc = DateTime.Now;

                // Step 1: Send Video with added hue
                byte[] i420Frame = new byte[frame.width * frame.height * 12 / 8];
                frame.CopyTo(i420Frame);

                byte[] nv12Frame = new byte[frame.width * frame.height * 12 / 8];
                int pixelCount = i420Frame.Length * 8 / 12;
                
                Array.Copy(i420Frame, 0, nv12Frame, 0, pixelCount);

                for (int i = 0; i < pixelCount / 4; i++)
                {
                    nv12Frame[pixelCount + i * 2] = i420Frame[pixelCount + i];
                    nv12Frame[pixelCount + i * 2 + 1] = i420Frame[pixelCount + pixelCount / 4 + i];
                }

                // Use the real length of the data (Media may send us a larger buffer)
                VideoFormat sendVideoFormat = VideoFormatUtil.GetSendVideoFormat((int)frame.height, (int)frame.width);
                var videoSendBuffer = new VideoSendBuffer(nv12Frame, (uint)nv12Frame.Length, sendVideoFormat);
                this.Call.GetLocalMediaSession().VideoSocket.Send(videoSendBuffer);
            }
        }
        
        private void OnCallUpdated(ICall sender, ResourceEventArgs<Call> args)
        {
            // Call state might have changed to established.
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

        private void OnVideoMediaReceived(object sender, VideoMediaReceivedEventArgs e)
        {
            Console.WriteLine("MEDIA RECEIVED");
            /*try
            {
                if (Interlocked.Decrement(ref this.maxIngestFrameCount) > 0)
                {
                    this.GraphLogger.Info(
                        $"[{this.Call.Id}]: Capturing image: [VideoMediaReceivedEventArgs(Data=<{e.Buffer.Data.ToString()}>, " +
                        $"Length={e.Buffer.Length}, Timestamp={e.Buffer.Timestamp}, Width={e.Buffer.VideoFormat.Width}, " +
                        $"Height={e.Buffer.VideoFormat.Height}, ColorFormat={e.Buffer.VideoFormat.VideoColorFormat}, FrameRate={e.Buffer.VideoFormat.FrameRate})]");
                }

                // 33 ms frequency ~ 30 fps
                if (DateTime.Now > this.lastVideoSentTimeUtc + TimeSpan.FromMilliseconds(33))
                {
                    this.lastVideoSentTimeUtc = DateTime.Now;

                    // Step 1: Send Video with added hue
                    byte[] buffer = new byte[e.Buffer.VideoFormat.Width * e.Buffer.VideoFormat.Height * 12 / 8];
                    Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                    // Use the real length of the data (Media may send us a larger buffer)
                    VideoFormat sendVideoFormat = e.Buffer.VideoFormat.GetSendVideoFormat();
                    var videoSendBuffer = new VideoSendBuffer(buffer, (uint)buffer.Length, sendVideoFormat);
                    this.Call.GetLocalMediaSession().VideoSocket.Send(videoSendBuffer);
                }
            }
            catch (Exception ex)
            {
                this.GraphLogger.Error(ex, $"[{this.Call.Id}] Exception in VideoMediaReceived");
            }*/

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
                    this.Call.GetLocalMediaSession().VideoSocket.Subscribe(VideoResolution.HD1080p, msi);
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
