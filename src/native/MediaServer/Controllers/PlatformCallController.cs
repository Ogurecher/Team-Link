namespace MediaServer.MediaBot
{
    using System.IO;
    using System.Text;
    using System.Threading.Tasks;
    using System.Net.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.Http.Internal;
    using Microsoft.Graph.Communications.Client;
    using Microsoft.Graph.Communications.Common.Telemetry;
    using Newtonsoft.Json;
    using MediaServer.Controllers;
    using MediaServer.Extensions;

    public class PlatformCallContoller : Controller
    {
        private static readonly HttpClient client = new HttpClient();

        private IGraphLogger logger;
        private Bot bot;

        public PlatformCallContoller(IGraphLogger logger, Bot bot)
        {
            this.logger = logger;
            this.bot = bot;
        }

        [HttpPost]
        [Route(HttpRouteConstants.CallSignalingRoutePrefix + "/" + HttpRouteConstants.OnIncomingRequestRoute)]
        public async Task OnIncomingRequestAsync()
        {
            this.Request.EnableRewind();
            this.logger.Info($"Received HTTP {this.Request.Method}, {this.Url}");

            using (var reader = new StreamReader(this.Request.Body))
            {
                var response = await this.bot.Client.ProcessNotificationAsync(this.Request.CreateRequestMessage()).ConfigureAwait(false);
                await response.CreateHttpResponseAsync(this.Response).ConfigureAwait(false);

                response.Headers.ConnectionClose = true;

                this.Request.Body.Seek(0, SeekOrigin.Begin);
                
                var body = reader.ReadToEnd();

                HttpContent content = new StringContent(body, Encoding.UTF8, "application/json");
                client.PostAsync("https://teamlink_main.ngrok.io/callback", content);
            }
        }
    }
}