namespace MediaServer.MediaBot
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Drawing;
    using System.Fabric;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.Graph;
    using Microsoft.Graph.Communications.Calls;
    using Microsoft.Graph.Communications.Calls.Media;
    using Microsoft.Graph.Communications.Client;
    using Microsoft.Graph.Communications.Common;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Microsoft.Graph.Communications.Resources;
    using Microsoft.Skype.Bots.Media;
    using MediaServer.Authentication;
    using MediaServer.Controllers;
    using MediaServer.Util.OnlineMeetings;
    using MediaServer.Util.Meetings;

    //using Sample.Common;
    //using Sample.Common.Authentication;
    //using Sample.Common.Meetings;
    //using Sample.Common.OnlineMeetings;
    //using Sample.HueBot.Controllers;
    //using Sample.HueBot.Extensions;

    /// <summary>
    /// The core bot logic.
    /// </summary>
    public class Bot
    {
        private readonly IGraphLogger logger;

        public OnlineMeetingHelper OnlineMeetings { get; }

        public ConcurrentDictionary<string, CallHandler> CallHandlers { get; } = new ConcurrentDictionary<string, CallHandler>();

        public Bot(BotOptions options, IGraphLogger graphLogger) {
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
        }

        public BotOptions Options { get; }

        public ICommunicationsClient Client { get; }

        public async Task<ICall> JoinCallAsync(JoinCallController.JoinCallBody joinCallBody)
        {
            var scenarioId = Guid.NewGuid();

            MeetingInfo meetingInfo;
            ChatInfo chatInfo;
            if (!string.IsNullOrWhiteSpace(joinCallBody.MeetingId))
            {
                // Meeting id is a cloud-video-interop numeric meeting id.
                var onlineMeeting = await this.OnlineMeetings
                    .GetOnlineMeetingAsync(joinCallBody.TenantId, joinCallBody.MeetingId, scenarioId)
                    .ConfigureAwait(false);

                meetingInfo = new OrganizerMeetingInfo { Organizer = onlineMeeting.Participants.Organizer.Identity, };
                chatInfo = onlineMeeting.ChatInfo;
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
            Console.WriteLine("BOT CALLSONUPDATED");
            foreach (var call in args.AddedResources)
            {
                Console.WriteLine(call);
                this.CallHandlers.GetOrAdd(call.Id, new CallHandler(call));
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
                    StreamDirections = StreamDirection.Recvonly,
                    SupportedAudioFormat = AudioFormat.Pcm16K,
                },
                new VideoSocketSettings {
                    StreamDirections = StreamDirection.Sendrecv,
                    ReceiveColorFormat = VideoColorFormat.NV12,

                    // We loop back the video in this sample. The MediaPlatform always sends only NV12 frames. So include only NV12 video in supportedSendVideoFormats
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
                    InstanceInternalPort = 8445,
                    InstancePublicIPAddress = instanceAddresses[0],
                    InstancePublicPort = publicMediaUrl.Port,
                    ServiceFqdn = publicMediaUrl.Host,
                },
                ApplicationId = options.AppId,
            };
        }
    }
}
