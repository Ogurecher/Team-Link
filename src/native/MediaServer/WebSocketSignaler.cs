using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Net.WebSockets;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.MixedReality.WebRTC;
using Newtonsoft.Json;

namespace WebSocketSignaler
{
    public class WebSocketSignaler
    {
        public PeerConnection PeerConnection { get; }

        public WebSocket WebSocket { get; }

        public bool IsClient { get; }

        public PeerConnection.IceCandidateReadytoSendDelegate IceCandidateReceived;

        public PeerConnection.LocalSdpReadyToSendDelegate SdpMessageReceived;

        private NamedPipeClientStream _clientPipe = null;

        private NamedPipeServerStream _serverPipe = null;

        private string _basePipeName;

        private StreamWriter _sendStream = null;

        private StreamReader _recvStream = null;

        private readonly string _serverName = ".";

        private readonly BlockingCollection<string> _incomingMessages = new BlockingCollection<string>(new ConcurrentQueue<string>());

        private readonly BlockingCollection<string> _outgoingMessages = new BlockingCollection<string>(new ConcurrentQueue<string>());

        public WebSocketSignaler(PeerConnection peerConnection, WebSocket webSocket)
        {
            PeerConnection = peerConnection;
            WebSocket = webSocket;
        }

        public async Task StartAsync()
        {
            PeerConnection.LocalSdpReadytoSend += PeerConnection_LocalSdpReadytoSend;
            PeerConnection.IceCandidateReadytoSend += PeerConnection_IceCandidateReadytoSend;
            _ = Task.Factory.StartNew(ProcessIncomingMessages, TaskCreationOptions.LongRunning);
            _ = Task.Factory.StartNew(WriteOutgoingMessages, TaskCreationOptions.LongRunning);
        }

        public void Stop()
        {
            _recvStream.Close();
            _outgoingMessages.CompleteAdding();
            _outgoingMessages.Dispose();
            PeerConnection.LocalSdpReadytoSend -= PeerConnection_LocalSdpReadytoSend;
            PeerConnection.IceCandidateReadytoSend -= PeerConnection_IceCandidateReadytoSend;
            _sendStream.Dispose();
            _recvStream.Dispose();
            _clientPipe.Dispose();
            _serverPipe.Dispose();
        }

        private async Task ProcessIncomingMessages()
        {
            string connectionStatus = await ProcessIncomingMessage();

            while (connectionStatus == "continue")
            {
                connectionStatus = await ProcessIncomingMessage();
            }

            await WebSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal closure", CancellationToken.None);
        }

        private async Task<string> ProcessIncomingMessage()
        {
            byte[] buffer = new byte[1024 * 25];

            WebSocketReceiveResult result = await WebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

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

                    SdpMessageReceived?.Invoke(type, sdp);
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

                    IceCandidateReceived?.Invoke(candidate, Int32.Parse(sdpMLineIndex), sdpMid);
                }
            }

            Console.WriteLine("Finished processing message");

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
            foreach (var msg in _outgoingMessages.GetConsumingEnumerable())
            {
                byte[] buffer = Encoding.ASCII.GetBytes(msg);
                await WebSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, false, CancellationToken.None);
            }
        }

        private async Task SendMessage(string msg)
        {
            try
            {
                Console.WriteLine($"[->] {msg}");
                byte[] buffer = Encoding.ASCII.GetBytes(msg);
                await WebSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception: {e.Message}");
                Environment.Exit(-1);
            }
        }

        private void PeerConnection_IceCandidateReadytoSend(string candidate, int sdpMlineindex, string sdpMid)
        {
            Dictionary<string, string> message = new Dictionary<string, string>
            {
                {"candidate", candidate},
                {"sdpMlineindex", sdpMlineindex.ToString()},
                {"sdpMid", sdpMid}
            };

            string serializedMessage = JsonConvert.SerializeObject(message);
            SendMessage(serializedMessage);
        }

        private void PeerConnection_LocalSdpReadytoSend(string type, string sdp)
        {
            Dictionary<string, string> message = new Dictionary<string, string>
            {
                {"type", type},
                {"sdp", sdp}
            };

            string serializedMessage = JsonConvert.SerializeObject(message);
            SendMessage(serializedMessage);
        }
    }
}