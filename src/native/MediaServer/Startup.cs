namespace MediaServer
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Net.WebSockets;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Http;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Microsoft.MixedReality.WebRTC;
    using MediaServer.MediaBot;
    using WebSocketSignaler;

    public class Startup
    {
        private IGraphLogger logger = new GraphLogger(typeof(Program).Assembly.GetName().Name, redirectToTrace: true);
        private IConfiguration configuration;
        private BotOptions botOptions;
        private Bot bot;

        private PeerConnection peerConnection;

        public Startup()
        {
            this.configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            this.botOptions = this.configuration.GetSection("Bot").Get<BotOptions>();
            this.peerConnection = new PeerConnection();

            this.bot = new Bot(this.botOptions, this.logger, this.peerConnection);
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<CookiePolicyOptions>(options =>
            {
                options.CheckConsentNeeded = context => true;
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });

            services.AddSingleton(this.logger);
            services.AddSingleton(this.botOptions);
            services.AddSingleton(this.bot);
            services.AddSingleton(this.peerConnection);
            services.AddMvc();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCookiePolicy();
            app.UseMvc();
            app.UseWebSockets();

            app.Use(async (context, next) =>  // MOVE TO CONTROLLERS LATER
            {
                if (context.Request.Path == "/websocket")
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        await InitializeWebRTC(context, webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                    }
                }
                else
                {
                    await next();
                }

            });
        }

        private async Task InitializeWebRTC(HttpContext context, WebSocket webSocket) // MOVE TO CONTROLLERS LATER
        {
            Console.WriteLine("Initializing WebRTC");

            var config = new PeerConnectionConfiguration
            {
                IceServers = new List<IceServer> {
                        new IceServer{ Urls = { "stun:stun.l.google.com:19302" } }
                    }
            };

            await this.peerConnection.InitializeAsync(config);
            Console.WriteLine("Peer connection initialized.");

            var signaler = new WebSocketSignaler(this.peerConnection, webSocket);

            signaler.SdpMessageReceived += async (string type, string sdp) => {
                await this.peerConnection.SetRemoteDescriptionAsync(type, sdp);
                if (type == "offer")
                {
                    this.peerConnection.CreateAnswer();
                }
            };

            signaler.IceCandidateReceived += (string candidate, int sdpMlineindex, string sdpMid) => {
                this.peerConnection.AddIceCandidate(sdpMid, sdpMlineindex, candidate);
            };

            this.peerConnection.Connected += () => {
                Console.WriteLine("!!! --- PeerConnection: connected --- !!!");
            };

            this.peerConnection.IceStateChanged += (IceConnectionState newState) => {
                Console.WriteLine($"!!! --- ICE state: {newState} --- !!!");
            };

            this.peerConnection.RenegotiationNeeded += () => {
                this.peerConnection.CreateOffer();
            };

            // DEBUG CODE, MIGHT NOT NEED IT LATER
            int numFrames = 0;
            peerConnection.VideoTrackAdded += (RemoteVideoTrack track) => {
                Console.WriteLine("VIDEO TRACK ADDED");
                track.I420AVideoFrameReady += (I420AVideoFrame frame) => {
                    ++numFrames;
                    if (numFrames % 60 == 0)
                    {
                        Console.WriteLine($"Received video frames: {numFrames}");
                    }
                };
            };

            // DEBUG CODE, MIGHT NOT NEED IT LATER
            int numAudioFrames = 0;
            this.peerConnection.AudioTrackAdded += (RemoteAudioTrack track) => {
                Console.WriteLine("AUDIO TRACK ADDED");
                track.AudioFrameReady += (AudioFrame frame) => {
                    ++numAudioFrames;
                    if (numAudioFrames % 100 == 0)
                    {
                        Console.WriteLine($"Received audio frames: {numAudioFrames}");
                    }
                };
            };

            await signaler.StartAsync();

            Console.WriteLine("Signaler started");
            Console.Read();
            signaler.Stop();
            this.peerConnection.Close();
            Console.WriteLine("Program terminated.");
        }
    }
}
