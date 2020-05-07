namespace MediaServer
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.IO;
    using System.Net.WebSockets;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.HttpsPolicy;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Microsoft.MixedReality.WebRTC;
    using NAudio.Wave;
    using MediaServer.MediaBot;
    using WebSocketSignaler;

    public class Startup
    {
        private IGraphLogger logger = new GraphLogger(typeof(Program).Assembly.GetName().Name, redirectToTrace: true);
        private IConfiguration configuration;
        private BotOptions botOptions;
        private Bot bot;

        private PeerConnection peerConnection;

        public WebSocket webSocket { get; }

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

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<CookiePolicyOptions>(options =>
            {
                // This lambda determines whether user consent for non-essential cookies is needed for a given request.
                options.CheckConsentNeeded = context => true;
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });

            services.AddSingleton(this.logger);
            services.AddSingleton(this.botOptions);
            services.AddSingleton(this.bot);
            services.AddSingleton(this.peerConnection);
            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
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

            signaler.SdpMessageReceived += (string type, string sdp) => {
                this.peerConnection.SetRemoteDescription(type, sdp);
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

            /*peerConnection.TransceiverAdded += (Transceiver transceiver) => {
                var redirectTransceiver = peerConnection.AddTransceiver(MediaKind.Video);
                redirectTransceiver.LocalVideoTrack = transceiver.RemoteVideoTrack;
            };*/

            /*int numFrames = 0;
            peerConnection.VideoTrackAdded += (RemoteVideoTrack track) => {
                track.I420AVideoFrameReady += (I420AVideoFrame frame) => {
                    ++numFrames;
                    if (numFrames % 60 == 0)
                    {
                        Console.WriteLine($"Received video frames: {numFrames}");
                    }
                };
            };*/

            int numFrames = 0;
            this.peerConnection.I420RemoteVideoFrameReady += (I420AVideoFrame frame) => {
                ++numFrames;
                if (numFrames % 60 == 0)
                {
                    Console.WriteLine($"Received video frames: {numFrames}");
                }
                byte[] convertedFrame = new byte[frame.width * frame.height * 12 / 8];
                frame.CopyTo(convertedFrame);

                byte[] nv12Frame = new byte[frame.width * frame.height * 12 / 8];
                int pixelCount = convertedFrame.Length * 8 / 12;
                
                Array.Copy(convertedFrame, 0, nv12Frame, 0, pixelCount);

                for (int i = 0; i < pixelCount / 4; i++)
                {
                    nv12Frame[pixelCount + i * 2] = convertedFrame[pixelCount + i];
                    nv12Frame[pixelCount + i * 2 + 1] = convertedFrame[pixelCount + pixelCount / 4 + i];
                }
            };

            int numAudioFrames = 0;
            this.peerConnection.RemoteAudioFrameReady += (AudioFrame frame) => {
                ++numAudioFrames;
                if (numAudioFrames % 100 == 0)
                {
                    Console.WriteLine($"Received audio frames: {numAudioFrames}");
                }
            };

            await signaler.StartAsync();

            Console.WriteLine("Signaler started");

            Console.WriteLine("Press a key to terminate the application...");
            Console.Read();
            signaler.Stop();
            this.peerConnection.Close();
            Console.WriteLine("Program termined.");
        }
    }
}
