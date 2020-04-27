namespace MediaServer.Controllers
{
    using System;
    using System.Fabric;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc;
    using MediaServer.MediaBot;

    public class JoinCallController : Controller
    {
        private Bot bot;
        private BotOptions botOptions;

        public JoinCallController(Bot bot, BotOptions botOptions)
        {
            this.bot = bot;
            this.botOptions = botOptions;
        }

        [HttpPost]
        [Route("joinCall")]
        public async Task<IActionResult> JoinCallAsync([FromBody] JoinCallBody joinCallBody)
        {
            var call = await this.bot.JoinCallAsync(joinCallBody).ConfigureAwait(false);

            var serviceURL = new UriBuilder($"{this.Request.Scheme}://{this.Request.Host}");

            return this.Ok(new JoinCallResponseBody
            {
                CallURL = serviceURL + HttpRouteConstants.CallRoute.Replace("{callId}", call.Id),
                CallsURL = serviceURL + HttpRouteConstants.Calls,
                ServiceLogsURL = serviceURL + HttpRouteConstants.Logs + call.Id,
                id = call.Id
            });
        }

        public class JoinCallBody
        {
            public string JoinURL { get; set; }

            public string MeetingId { get; set; }

            public string TenantId { get; set; }

            public string DisplayName { get; set; }

            public string ChatInfo { get; set; }

            public string MeetingInfo { get; set; }
        }

        public class JoinCallResponseBody
        {
            /// <summary>
            /// Gets or sets the URL for the newly created call.
            /// </summary>
            public string CallURL { get; set; }

            /// <summary>
            /// Gets or sets the URL for getting all the logs on this node.
            /// </summary>
            public string CallsURL { get; set; }

            /// <summary>
            /// Gets or sets the URL for the service logs on this node.
            /// </summary>
            public string ServiceLogsURL { get; set; }

            public string id { get; set; }
        }
    }
}
