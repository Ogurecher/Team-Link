namespace MediaServer
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.IO;
    using System.Net.WebSockets;
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
    using MediaServer.MediaBot;
    using NamedPipeSignaler;
    public class Startup
    {
        private IGraphLogger logger = new GraphLogger(typeof(Program).Assembly.GetName().Name, redirectToTrace: true);
        private IConfiguration configuration;
        private BotOptions botOptions;
        private Bot bot;

        public WebSocket webSocket { get; }

        public Startup()
        {
            this.configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            this.botOptions = this.configuration.GetSection("Bot").Get<BotOptions>();

            this.bot = new Bot(this.botOptions, this.logger);
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
                        await Echo(context, webSocket);
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

        private async Task Echo(HttpContext context, WebSocket webSocket) // MOVE TO CONTROLLERS LATER
        {
            Console.WriteLine("Initializing WebRTC");

            using (var peerConnection = new PeerConnection())
            {
                var config = new PeerConnectionConfiguration
                {
                    IceServers = new List<IceServer> {
                            new IceServer{ Urls = { "stun:stun.l.google.com:19302" } }
                        }
                };

                await peerConnection.InitializeAsync(config);
                Console.WriteLine("Peer connection initialized.");

                var signaler = new NamedPipeSignaler(peerConnection, webSocket);

                signaler.SdpMessageReceived += (string type, string sdp) => {
                    peerConnection.SetRemoteDescription(type, sdp);
                    if (type == "offer")
                    {
                        peerConnection.CreateAnswer();
                    }
                };

                signaler.IceCandidateReceived += (string candidate, int sdpMlineindex, string sdpMid) => {
                    peerConnection.AddIceCandidate(sdpMid, sdpMlineindex, candidate);
                };

                await signaler.StartAsync();
                Console.WriteLine("Signaler started");

                Console.WriteLine("Press a key to terminate the application...");
                Console.Read();
                signaler.Stop();
                Console.WriteLine("Program termined.");
            }
        }
    }
}
