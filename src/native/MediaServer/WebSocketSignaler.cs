using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.MixedReality.WebRTC;
using Newtonsoft.Json;
using MediaServer;

namespace WebSocketSignaler
{
    public class WebSocketSignaler
    {
        public PeerConnection peerConnection { get; }

        public WebSocket webSocket { get; }

        public PeerConnection.IceCandidateReadytoSendDelegate IceCandidateReceived;

        public PeerConnection.LocalSdpReadyToSendDelegate SdpMessageReceived;

        private readonly BlockingCollection<string> outgoingMessages = new BlockingCollection<string>(new ConcurrentQueue<string>());

        public WebSocketSignaler(PeerConnection peerConnection, WebSocket webSocket)
        {
            this.peerConnection = peerConnection;
            this.webSocket = webSocket;
        }

        public async Task StartAsync()
        {
            this.peerConnection.LocalSdpReadytoSend += LocalSdpReadytoSend;
            this.peerConnection.IceCandidateReadytoSend += IceCandidateReadytoSend;

            _ = Task.Factory.StartNew(ProcessIncomingMessages, TaskCreationOptions.LongRunning);
            _ = Task.Factory.StartNew(WriteOutgoingMessages, TaskCreationOptions.LongRunning);
        }

        public void Stop()
        {
            outgoingMessages.CompleteAdding();
            outgoingMessages.Dispose();

            this.peerConnection.LocalSdpReadytoSend -= LocalSdpReadytoSend;
            this.peerConnection.IceCandidateReadytoSend -= IceCandidateReadytoSend;
        }

        private async Task ProcessIncomingMessages()
        {
            string connectionStatus = await ProcessIncomingMessage();

            while (connectionStatus == "continue")
            {
                connectionStatus = await ProcessIncomingMessage();
            }

            await this.webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal closure", CancellationToken.None);
        }

        private async Task<string> ProcessIncomingMessage()
        {
            byte[] buffer = new byte[Config.SIGNALING_BUFFER_SIZE];

            WebSocketReceiveResult result = await this.webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            var messageBytes = new ArraySegment<byte>(buffer, 0, result.Count).ToArray();

            using(MemoryStream ms = new MemoryStream(messageBytes))
            {
                StreamReader streamReader = new StreamReader(ms);

                string messageStr = streamReader.ReadLine();

                if (messageStr == "null")
                {
                    return "continue";
                }

                if (messageStr == null)
                {
                    return "end";
                }

                Dictionary<string, string> messageJson = JsonConvert.DeserializeObject<Dictionary<string, string>>(messageStr);

                if (messageJson.ContainsKey("sdp"))
                {
                    string type = messageJson["type"];
                    string sdp = messageJson["sdp"];

                    Console.WriteLine("[<-] sdp");
                    Console.WriteLine(type);
                    Console.WriteLine(sdp);

                    SdpMessage msg = new SdpMessage();
                    msg.Type = SdpMessage.StringToType(type);
                    msg.Content = sdp;

                    SdpMessageReceived?.Invoke(msg);
                }
                else if (messageJson.ContainsKey("candidate"))
                {
                    string sdpMid = messageJson["sdpMid"];
                    string sdpMLineIndex = messageJson["sdpMLineIndex"];
                    string candidate = messageJson["candidate"];

                    Console.WriteLine("[<-] ice");
                    Console.WriteLine(candidate);
                    Console.WriteLine(sdpMLineIndex);
                    Console.WriteLine(sdpMid);

                    IceCandidate msg = new IceCandidate();
                    msg.SdpMid = sdpMid;
                    msg.SdpMlineIndex = Int32.Parse(sdpMLineIndex);
                    msg.Content = candidate;

                    IceCandidateReceived?.Invoke(msg);
                }
            }

            if (result.CloseStatus.HasValue)
            {
                return "end";
            }
            else
            {
                return "continue";
            }
        }

        private async Task WriteOutgoingMessages()
        {
            foreach (var msg in outgoingMessages.GetConsumingEnumerable())
            {
                byte[] buffer = Encoding.ASCII.GetBytes(msg);
                await this.webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, false, CancellationToken.None);
            }
        }

        private async Task SendMessage(string msg)
        {
            try
            {
                Console.WriteLine($"[->] {msg}");
                byte[] buffer = Encoding.ASCII.GetBytes(msg);
                await this.webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception: {e.Message}");
                Environment.Exit(-1);
            }
        }

        private void IceCandidateReadytoSend(IceCandidate candidate)
        {
            Dictionary<string, string> message = new Dictionary<string, string>
            {
                {"candidate", candidate.Content},
                {"sdpMlineindex", candidate.SdpMlineIndex.ToString()},
                {"sdpMid", candidate.SdpMid}
            };

            string serializedMessage = JsonConvert.SerializeObject(message);
            SendMessage(serializedMessage);
        }

        private void LocalSdpReadytoSend(SdpMessage message)
        {
            Dictionary<string, string> outMessage = new Dictionary<string, string>
            {
                {"type", SdpMessage.TypeToString(message.Type)},
                {"sdp", message.Content}
            };

            string serializedMessage = JsonConvert.SerializeObject(outMessage);
            SendMessage(serializedMessage);
        }
    }
}