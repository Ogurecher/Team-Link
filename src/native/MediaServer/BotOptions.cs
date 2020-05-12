namespace MediaServer.MediaBot
{
    using System;

    public class BotOptions
    {
        public string AppId { get; set; }

        public string AppSecret { get; set; }

        /// <summary>
        /// Gets or sets the callback URL of the application.
        /// E.g. https://your-bot-service.net/api/calls.
        /// </summary>
        public Uri BotBaseUrl { get; set; }

        /// <summary>
        /// Gets or sets the TCP address for media.
        /// E.g. net.tcp://your-bot-service.net:mediaPort.
        /// </summary>
        public Uri BotMediaProcessorUrl { get; set; }

        public string Certificate { get; set; }

        /// <summary>
        /// Gets or sets the communications platform endpoint uri.
        /// E.g. https://graph.microsoft.com/v1.0.
        /// </summary>
        public Uri PlaceCallEndpointUrl { get; set; }
    }
}
