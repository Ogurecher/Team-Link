namespace MediaServer.Util.OnlineMeetings
{
    using System;
    using System.Threading.Tasks;
    using Microsoft.Graph;
    using Microsoft.Graph.Communications.Client.Authentication;
    using Microsoft.Graph.Communications.Common;

    public class OnlineMeetingHelper
    {
        private readonly Uri graphEndpointUri;
        private readonly IRequestAuthenticationProvider requestAuthenticationProvider;

        public OnlineMeetingHelper(IRequestAuthenticationProvider requestAuthenticationProvider, Uri graphUri)
        {
            this.requestAuthenticationProvider = requestAuthenticationProvider;
            this.graphEndpointUri = graphUri;
        }

        public async Task<OnlineMeeting> GetOnlineMeetingAsync(string tenantId, string meetingId, Guid scenarioId)
        {
            IAuthenticationProvider GetAuthenticationProvider()
            {
                return new DelegateAuthenticationProvider(async request =>
                {
                    request.Headers.Add(HttpConstants.HeaderNames.ScenarioId, scenarioId.ToString());
                    request.Headers.Add(HttpConstants.HeaderNames.ClientRequestId, Guid.NewGuid().ToString());

                    await this.requestAuthenticationProvider
                        .AuthenticateOutboundRequestAsync(request, tenantId)
                        .ConfigureAwait(false);
                });
            }

            var statelessClient = new GraphServiceClient(this.graphEndpointUri.AbsoluteUri, GetAuthenticationProvider());
            var meetingRequest = statelessClient.Communications.OnlineMeetings[meetingId].Request();

            var meeting = await meetingRequest.GetAsync().ConfigureAwait(false);

            return meeting;
        }
    }
}