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
    using MediaServer.Controllers;
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

            app.Use(async (context, next) =>
            {
                if (context.Request.Path == HttpRouteConstants.WebSocketRoute)
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

        private async Task InitializeWebRTC(HttpContext context, WebSocket webSocket)
        {
            Console.WriteLine("Initializing WebRTC");

            var config = new PeerConnectionConfiguration
            {
                IceServers = new List<IceServer> {
                        new IceServer{ Urls = { Config.STUN_URI } }
                    }
            };

            await this.peerConnection.InitializeAsync(config);
            Console.WriteLine("Peer connection initialized.");

            var signaler = new WebSocketSignaler(this.peerConnection, webSocket);

            signaler.SdpMessageReceived += async (SdpMessage message) => {
                await this.peerConnection.SetRemoteDescriptionAsync(message);
                if (message.Type == SdpMessageType.Offer)
                {
                    this.peerConnection.CreateAnswer();
                }
            };

            signaler.IceCandidateReceived += (IceCandidate candidate) => {
                this.peerConnection.AddIceCandidate(candidate);
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

            await signaler.StartAsync();

            Console.WriteLine("Signaler started");
            Console.Read();
            signaler.Stop();
            this.peerConnection.Close();
            Console.WriteLine("Program terminated.");
        }
    }
}
