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

    /// <summary>
    /// Entry point for handling call-related web hook requests from the stateful client.
    /// </summary>
    public class PlatformCallContoller : Controller
    {
        private static readonly HttpClient client = new HttpClient();

        private IGraphLogger logger;
        private Bot bot;

        /// <summary>
        /// Initializes a new instance of the <see cref="PlatformCallContoller"/> class.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        /// <param name="bot">Hue bot instance.</param>
        public PlatformCallContoller(IGraphLogger logger, Bot bot)
        {
            this.logger = logger;
            this.bot = bot;
        }

        /// <summary>
        /// Handle a callback for an existing call.
        /// </summary>
        /// <returns>
        /// The <see cref="Task"/>.
        /// </returns>
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
                client.PostAsync("https://96c781c1.ngrok.io/callback", content);
            }


            //HttpContent content = new StringContent(JsonConvert.SerializeObject(bodyString), Encoding.UTF8, "application/json");
            //HttpContent content = this.Request.CreateRequestMessage().Content;

            //client.PostAsync("https://7477d595.ngrok.io/callback", content);

            // Pass the incoming message to the sdk. The sdk takes care of what to do with it.
            //var response = await this.bot.Client.ProcessNotificationAsync(this.Request.CreateRequestMessage()).ConfigureAwait(false);
            //await response.CreateHttpResponseAsync(this.Response).ConfigureAwait(false);

            // Enforce the connection close to ensure that requests are evenly load balanced so
            // calls do no stick to one instance of the worker role.
            //response.Headers.ConnectionClose = true;
        }
    }
}