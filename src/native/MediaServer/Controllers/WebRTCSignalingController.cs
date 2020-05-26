namespace MediaServer.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Net.WebSockets;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.MixedReality.WebRTC;
    using WebSocketSignaler;

    [Route(HttpRouteConstants.WebSocketRoute)]
    public class WebRTCSignalingController : Controller
    {
        private PeerConnection peerConnection;

        public WebRTCSignalingController(PeerConnection peerConnection)
        {
            this.peerConnection = peerConnection;
        }

        [HttpGet]
        public async Task Get()
        {
            var context = HttpContext;
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

        private async Task InitializeWebRTC(HttpContext context, WebSocket webSocket)
        {
            Console.WriteLine("Initializing WebRTC");

            try
            {
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
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
    }
}