/*namespace MediaServer.tmp
{
    using System.Collections.Generic;
    using System.Fabric;
    using System.IO;
    using System.Reflection;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Server.HttpSys;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using MediaServer.Bot;

    /// <summary>
    /// The FabricRuntime creates an instance of this class for each service type instance.
    /// </summary>
    class MediaBot
    {
        private IGraphLogger logger;
        private IConfiguration configuration;
        private BotOptions botOptions;
        private Bot bot;

        /// <summary>
        /// Initializes a new instance of the <see cref="HueBot" /> class.
        /// </summary>
        /// <param name="context">Stateful service context from service fabric.</param>
        /// <param name="logger">Global logger instance.</param>
        /// <param name="observer">Global observer instance.</param>
        public MediaBot(IGraphLogger logger)
        {
            this.logger = logger;
            // Set directory to where the assemblies are running from.
            // This is necessary for Media binaries to pick up logging configuration.
            var location = Assembly.GetExecutingAssembly().Location;
            Directory.SetCurrentDirectory(Path.GetDirectoryName(location));
        }

        /// <summary>
        /// Optional override to create listeners (like tcp, http) for this service instance.
        /// </summary>
        /// <returns>The collection of listeners.</returns>
        /// 


        //   ServiceReplicaListener is from Azure. Need to replace !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
        {
            this.configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            this.botOptions = this.configuration.GetSection("Bot").Get<BotOptions>();

            this.bot = new Bot(this.botOptions, this.logger);

            var serviceReplicaListeners = new List<ServiceReplicaListener>();
            foreach (string endpointName in new[] { "ServiceEndpoint", "SignalingPort", "LocalEndpoint" })
            {
                serviceReplicaListeners.Add(new ServiceReplicaListener(
                    serviceContext =>
                        new HttpSysCommunicationListener(serviceContext, endpointName, (url, listener) =>
                        {
                            ServiceEventSource.Current.ServiceMessage(serviceContext, $"Starting web listener on {url}");
                            return this.CreateWebHost(url);
                        }),
                    endpointName));
            }

            return serviceReplicaListeners.ToArray();
        }

        /// <summary>
        /// Creates the hue bot web host.
        /// </summary>
        /// <param name="url">The URL to host at.</param>
        /// <returns>web host.</returns>
        
    }
}*/
