namespace MediaServer.MediaBot
{
    using System;
    using System.Linq;
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

    public class CallHandler : HeartbeatHandler
    {
        public ICall Call { get; }

        public const uint DominantSpeakerNone = DominantSpeakerChangedEventArgs.None;

        private const double WaitForMs = Config.END_CALL_TIMER;

        private uint subscribedToMsi = DominantSpeakerNone;

        private Participant subscribedToParticipant;

        private Timer endCallTimer;

        private PeerConnection peerConnection;

        private Transceiver teamsVideoTransceiver;
        
        private Transceiver teamsAudioTransceiver;

        private CallHandlerVideo callHandlerVideo;

        private CallHandlerAudio callHandlerAudio;

        protected override Task HeartbeatAsync(ElapsedEventArgs args)
        {
            return this.Call.KeepAliveAsync();
        }

        public CallHandler(ICall statefulCall, PeerConnection peerConnection)
            : base(TimeSpan.FromMinutes(10), statefulCall?.GraphLogger)
        {
            this.Call = statefulCall;

            this.callHandlerVideo = new CallHandlerVideo(this.Call);
            this.callHandlerAudio = new CallHandlerAudio(this.Call);

            this.peerConnection = peerConnection;

            this.peerConnection.VideoTrackAdded += this.callHandlerVideo.OnClientVideoTrackAdded;
            this.peerConnection.VideoTrackRemoved += this.callHandlerVideo.OnClientVideoTrackRemoved;

            this.peerConnection.AudioTrackAdded += this.callHandlerAudio.OnClientAudioTrackAdded;
            this.peerConnection.AudioTrackRemoved += this.callHandlerAudio.OnClientAudioTrackRemoved;

            TransceiverInitSettings transceiverInitSettings = new TransceiverInitSettings();
            transceiverInitSettings.InitialDesiredDirection = Transceiver.Direction.Inactive;
            
            if (this.peerConnection.AssociatedTransceivers.ToList().Count != 0)
            {
                this.teamsAudioTransceiver = this.peerConnection.AssociatedTransceivers.ToList()[0];
                this.callHandlerAudio.clientAudioTrack = this.peerConnection.AssociatedTransceivers.ToList()[0].RemoteAudioTrack;
                this.callHandlerAudio.clientAudioTrack.AudioFrameReady += this.callHandlerAudio.OnClientAudioReceived;

                this.teamsVideoTransceiver = this.peerConnection.AssociatedTransceivers.ToList()[1];
                this.callHandlerVideo.clientVideoTrack = this.peerConnection.AssociatedTransceivers.ToList()[1].RemoteVideoTrack;
                this.callHandlerVideo.clientVideoTrack.I420AVideoFrameReady += this.callHandlerVideo.OnClientVideoReceived;
            }
            else
            {
                this.teamsAudioTransceiver = this.peerConnection.AddTransceiver(MediaKind.Audio, transceiverInitSettings);
                this.teamsVideoTransceiver = this.peerConnection.AddTransceiver(MediaKind.Video, transceiverInitSettings);
            }
            
            LocalVideoTrack teamsVideoTrack = LocalVideoTrack.CreateFromExternalSource("TeamsVideoTrack",
                ExternalVideoTrackSource.CreateFromI420ACallback(this.callHandlerVideo.CustomI420AFrameCallback));
            this.teamsVideoTransceiver.LocalVideoTrack = teamsVideoTrack;

            this.teamsVideoTransceiver.DesiredDirection = Transceiver.Direction.SendReceive;

            LocalAudioTrack teamsAudioTrack = LocalAudioTrack.CreateFromExternalSource("TeamsAudioTrack",
                ExternalAudioTrackSource.CreateFromCallback(this.callHandlerAudio.CustomAudioFrameCallback));
            this.teamsAudioTransceiver.LocalAudioTrack = teamsAudioTrack;

            this.teamsAudioTransceiver.DesiredDirection = Transceiver.Direction.SendReceive;

            this.Call.OnUpdated += this.OnCallUpdated;
            if (this.Call.GetLocalMediaSession() != null)
            {
                this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged += this.OnDominantSpeakerChanged;
                this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived += this.callHandlerVideo.OnTeamsVideoReceived;
                this.Call.GetLocalMediaSession().AudioSocket.AudioMediaReceived += this.callHandlerAudio.OnTeamsAudioReceived;
            }

            this.Call.Participants.OnUpdated += this.OnParticipantsUpdated;
            this.endCallTimer = new Timer(CallHandler.WaitForMs);
            this.endCallTimer.Enabled = false;
            this.endCallTimer.AutoReset = false;
            this.endCallTimer.Elapsed += this.OnTimerElapsed;
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            this.peerConnection.VideoTrackAdded -= this.callHandlerVideo.OnClientVideoTrackAdded;
            this.peerConnection.VideoTrackRemoved -= this.callHandlerVideo.OnClientVideoTrackRemoved;
            this.callHandlerVideo.clientVideoTrack.I420AVideoFrameReady -= this.callHandlerVideo.OnClientVideoReceived;

            this.peerConnection.AudioTrackAdded -= this.callHandlerAudio.OnClientAudioTrackAdded;
            this.peerConnection.AudioTrackRemoved -= this.callHandlerAudio.OnClientAudioTrackRemoved;
            this.callHandlerAudio.clientAudioTrack.AudioFrameReady -= this.callHandlerAudio.OnClientAudioReceived;

            this.Call.OnUpdated -= this.OnCallUpdated;
            this.Call.Participants.OnUpdated -= this.OnParticipantsUpdated;

            this.Call.GetLocalMediaSession().AudioSocket.DominantSpeakerChanged -= this.OnDominantSpeakerChanged;
            this.Call.GetLocalMediaSession().VideoSocket.VideoMediaReceived -= this.callHandlerVideo.OnTeamsVideoReceived;
            this.Call.GetLocalMediaSession().AudioSocket.AudioMediaReceived -= this.callHandlerAudio.OnTeamsAudioReceived;
            
            foreach (var participant in this.Call.Participants)
            {
                participant.OnUpdated -= this.OnParticipantUpdated;
            }

            this.endCallTimer.Elapsed -= this.OnTimerElapsed;
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

                uint msi = (uint)Int32.Parse(participant.Resource.MediaStreams.FirstOrDefault(stream => stream.MediaType == Modality.Audio).SourceId);

                this.subscribedToMsi = msi;

                this.Subscribe(msi);
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
                if (participant == null || participant.Resource.Info.Identity.Application != null)
                {
                    this.subscribedToParticipant = null;

                    this.GraphLogger.Info($"[{this.Call.Id}] Could not find valid non-bot participant using MSI {msi}");

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
