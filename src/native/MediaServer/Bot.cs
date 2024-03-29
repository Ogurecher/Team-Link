namespace MediaServer.MediaBot
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.Graph;
    using Microsoft.Graph.Communications.Calls;
    using Microsoft.Graph.Communications.Calls.Media;
    using Microsoft.Graph.Communications.Client;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Microsoft.Graph.Communications.Resources;
    using Microsoft.MixedReality.WebRTC;
    using Microsoft.Skype.Bots.Media;
    using Newtonsoft.Json;
    using MediaServer;
    using MediaServer.Authentication;
    using MediaServer.Controllers;
    using MediaServer.Util.OnlineMeetings;
    using MediaServer.Util.Meetings;

    public class Bot
    {
        private readonly IGraphLogger logger;

        public OnlineMeetingHelper OnlineMeetings { get; }

        public ConcurrentDictionary<string, CallHandler> CallHandlers { get; } = new ConcurrentDictionary<string, CallHandler>();

        private PeerConnection peerConnection;

        public Bot(BotOptions options, IGraphLogger graphLogger, PeerConnection peerConnection) {
            this.Options = options;
            this.logger = graphLogger;

            var name = this.GetType().Assembly.GetName().Name;
            var builder = new CommunicationsClientBuilder(
                name,
                options.AppId,
                this.logger);

            var authProvider = new AuthenticationProvider(
                name,
                options.AppId,
                options.AppSecret,
                this.logger);

            builder.SetAuthenticationProvider(authProvider);

            builder.SetNotificationUrl(options.BotBaseUrl);
            builder.SetMediaPlatformSettings(this.MediaInit(options));
            builder.SetServiceBaseUrl(options.PlaceCallEndpointUrl);
            Console.Write("OK");

            this.Client = builder.Build();

            this.Client.Calls().OnUpdated += this.CallsOnUpdated;

            this.OnlineMeetings = new OnlineMeetingHelper(authProvider, options.PlaceCallEndpointUrl);

            this.peerConnection = peerConnection;
        }

        public BotOptions Options { get; }

        public ICommunicationsClient Client { get; }

        public async Task<ICall> JoinCallAsync(JoinCallController.JoinCallBody joinCallBody)
        {
            var scenarioId = Guid.NewGuid();

            MeetingInfo meetingInfo;
            ChatInfo chatInfo;
            if (!string.IsNullOrWhiteSpace(joinCallBody.MeetingInfo))
            {
                meetingInfo = JsonConvert.DeserializeObject<OrganizerMeetingInfo>(joinCallBody.MeetingInfo);
                chatInfo = JsonConvert.DeserializeObject<ChatInfo>(joinCallBody.ChatInfo);
            }
            else
            {
                (chatInfo, meetingInfo) = JoinInfo.ParseJoinURL(joinCallBody.JoinURL);
            }

            var tenantId =
                joinCallBody.TenantId ??
                (meetingInfo as OrganizerMeetingInfo)?.Organizer.GetPrimaryIdentity()?.GetTenantId();
            ILocalMediaSession mediaSession = this.CreateLocalMediaSession();

            var joinParams = new JoinMeetingParameters(chatInfo, meetingInfo, mediaSession)
            {
                TenantId = tenantId,
            };

            if (!string.IsNullOrWhiteSpace(joinCallBody.DisplayName))
            {
                joinParams.GuestIdentity = new Identity
                {
                    Id = Guid.NewGuid().ToString(),
                    DisplayName = joinCallBody.DisplayName,
                };
            }

            var statefulCall = await this.Client.Calls().AddAsync(joinParams, scenarioId).ConfigureAwait(false);
            this.logger.Info($"Call creation complete: {statefulCall.Id}");
            return statefulCall;
        }
        
        private void CallsOnUpdated(ICallCollection sender, CollectionEventArgs<ICall> args)
        {
            foreach (var call in args.AddedResources)
            {
                Console.WriteLine(call);
                this.CallHandlers.GetOrAdd(call.Id, new CallHandler(call, this.peerConnection));
            }

            foreach (var call in args.RemovedResources)
            {
                if (this.CallHandlers.TryRemove(call.Id, out CallHandler handler))
                {
                    handler.Dispose();
                }
            }
        }
        
        private ILocalMediaSession CreateLocalMediaSession(Guid mediaSessionId = default(Guid)) {
            var mediaSession = this.Client.CreateMediaSession(
                new AudioSocketSettings {
                    StreamDirections = StreamDirection.Sendrecv,
                    SupportedAudioFormat = AudioFormat.Pcm16K,
                },
                new VideoSocketSettings {
                    StreamDirections = StreamDirection.Sendrecv,
                    ReceiveColorFormat = VideoColorFormat.NV12,

                    SupportedSendVideoFormats = new List<VideoFormat>
                    {
                        VideoFormat.NV12_270x480_15Fps,
                        VideoFormat.NV12_320x180_15Fps,
                        VideoFormat.NV12_360x640_15Fps,
                        VideoFormat.NV12_424x240_15Fps,
                        VideoFormat.NV12_480x270_15Fps,
                        VideoFormat.NV12_480x848_30Fps,
                        VideoFormat.NV12_640x360_15Fps,
                        VideoFormat.NV12_720x1280_30Fps,
                        VideoFormat.NV12_848x480_30Fps,
                        VideoFormat.NV12_960x540_30Fps,
                        VideoFormat.NV12_1280x720_30Fps,
                        VideoFormat.NV12_1920x1080_30Fps,
                    },
                },
                mediaSessionId: mediaSessionId);
            return mediaSession;
        }

        private MediaPlatformSettings MediaInit(BotOptions options) {
            var publicMediaUrl = options.BotMediaProcessorUrl ?? options.BotBaseUrl;

            var instanceAddresses = Dns.GetHostEntry(publicMediaUrl.Host).AddressList;
            if (instanceAddresses.Length == 0) {
                throw new InvalidOperationException("Could not resolve the PIP hostname. Please make sure that PIP is properly configured for the service");
            }

            return new MediaPlatformSettings() {
                MediaPlatformInstanceSettings = new MediaPlatformInstanceSettings() {
                    CertificateThumbprint = options.Certificate,
                    InstanceInternalPort = Config.MEDIA_PORT,
                    InstancePublicIPAddress = instanceAddresses[0],
                    InstancePublicPort = publicMediaUrl.Port,
                    ServiceFqdn = publicMediaUrl.Host,
                },
                ApplicationId = options.AppId,
            };
        }
    }
}
