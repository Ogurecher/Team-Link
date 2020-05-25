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

            WebSocketOptions webSocketOptions = new WebSocketOptions() 
            {
                KeepAliveInterval = TimeSpan.FromSeconds(120),
                ReceiveBufferSize = 4 * 1024
            };
            webSocketOptions.AllowedOrigins.Add(Config.MAIN_SERVER_URI);

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCookiePolicy();
            app.UseWebSockets(webSocketOptions);
            app.UseMvc();
        }

    }
}
