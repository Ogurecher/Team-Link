namespace MediaServer.MediaBot
{
    using System;

    public class BotOptions
    {
        public string AppId { get; set; }

        public string AppSecret { get; set; }

        public Uri BotBaseUrl { get; set; }

        public Uri BotMediaProcessorUrl { get; set; }

        public string Certificate { get; set; }

        public Uri PlaceCallEndpointUrl { get; set; }
    }
}
