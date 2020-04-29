using System;
using System.Collections.Concurrent;
using System.IO;
using System.IO.Pipes;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.MixedReality.WebRTC;

namespace NamedPipeSignaler
{
    public class NamedPipeSignaler
    {
        public PeerConnection PeerConnection { get; }

        public WebSocket WebSocket { get; }

        public bool IsClient { get; }

        public PeerConnection.IceCandidateReadytoSendDelegate IceCandidateReceived;

        public PeerConnection.LocalSdpReadyToSendDelegate SdpMessageReceived;

        /// <summary>
        /// Client pipe for sending data. This is connected to the remote signaler's server pipe. 
        /// </summary>
        private NamedPipeClientStream _clientPipe = null;

        /// <summary>
        /// Server pipe for receiving data. This is connected to the remote signaler's client pipe. 
        /// </summary>
        private NamedPipeServerStream _serverPipe = null;

        /// <summary>
        /// Base pipe name for the forward pipe. The reverse pipe has an extra "_r" suffix.
        /// </summary>
        private string _basePipeName;

        /// <summary>
        /// Write stream wrapping the client pipe, for writing outgoing messages.
        /// </summary>
        private StreamWriter _sendStream = null;

        /// <summary>
        /// Read stream wrapping the server pipe, for reading incoming messages.
        /// </summary>
        private StreamReader _recvStream = null;

        private readonly string _serverName = "."; // myhuebot.ngrok.io/websocket

        /// <summary>
        /// Thread-safe collection of outgoing message, with automatic blocking read.
        /// </summary>
        private readonly BlockingCollection<string> _outgoingMessages = new BlockingCollection<string>(new ConcurrentQueue<string>());

        public NamedPipeSignaler(PeerConnection peerConnection, WebSocket webSocket)
        {
            PeerConnection = peerConnection;
            WebSocket = webSocket;
        }

        /// <summary>
        /// Start the signaler background tasks and connect to the remote signaler.
        /// </summary>
        /// <returns>Asynchronous task completed once the local and remote signalers
        /// are connected with each other, and the background reading and writing tasks
        /// are running and ready to process incoming and outgoing messages.</returns>
        public async Task StartAsync()
        {
            PeerConnection.LocalSdpReadytoSend += PeerConnection_LocalSdpReadytoSend;
            PeerConnection.IceCandidateReadytoSend += PeerConnection_IceCandidateReadytoSend;
            _ = Task.Factory.StartNew(ProcessIncomingMessages, TaskCreationOptions.LongRunning);
            _ = Task.Factory.StartNew(WriteOutgoingMessages, TaskCreationOptions.LongRunning);
        }

        /// <summary>
        /// Stop the signaler background tasks, and dispose of all native resources.
        /// </summary>
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

        /// <summary>
        /// Entry point for the reading task which read incoming messages from the
        /// receiving pipe and dispatch them through events to the WebRTC peer.
        /// </summary>
        private async Task ProcessIncomingMessages()
        {
            // ReadLine() will block while waiting for a new line
            var buffer = new byte[1024 * 4];

            WebSocketReceiveResult result = await WebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            string bufferStr = Encoding.ASCII.GetString(buffer);

            foreach (var line in bufferStr.Split(new string[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries))
            {
                Console.WriteLine($"[<-] {line}");
                if (line == "ice")
                {
                    string sdpMid = _recvStream.ReadLine();
                    int sdpMlineindex = int.Parse(_recvStream.ReadLine());

                    // The ICE candidate is a multi-line field, ends with an empty line
                    string candidate = "";
                    while ((line = _recvStream.ReadLine()) != null)
                    {
                        if (line.Length == 0)
                        {
                            break;
                        }
                        candidate += line;
                        candidate += "\n";
                    }

                    Console.WriteLine($"[<-] ICE candidate: {sdpMid} {sdpMlineindex} {candidate}");
                    IceCandidateReceived?.Invoke(sdpMid, sdpMlineindex, candidate);
                }
                else if (line == "sdp")
                {
                    string type = _recvStream.ReadLine();

                    // The SDP message content is a multi-line field, ends with an empty line
                    string sdp = "";
                    while ((line = _recvStream.ReadLine()) != null)
                    {
                        if (line.Length == 0)
                        {
                            break;
                        }
                        sdp += line;
                        sdp += "\n";
                    }

                    Console.WriteLine($"[<-] SDP message: {type} {sdp}");
                    SdpMessageReceived?.Invoke(type, sdp);
                }
            }

            Console.WriteLine("Finished processing messages");
        }

        /// <summary>
        /// Entry point for the writing task dequeuing outgoing messages and
        /// writing them to the sending pipe.
        /// </summary>
        private async Task WriteOutgoingMessages()
        {
            // GetConsumingEnumerable() will block when no message is available,
            // until CompleteAdding() is called from Stop().
            foreach (var msg in _outgoingMessages.GetConsumingEnumerable())
            {
                // Write the message and wait for the stream to be ready again
                // for the next Write() call.
                //_sendStream.Write(msg);

                byte[] buffer = Encoding.ASCII.GetBytes(msg);
                await WebSocket.SendAsync(new ArraySegment<byte>(buffer), 0, false, CancellationToken.None);
            }
        }

        /// <summary>
        /// Send a message to the remote signaler.
        /// </summary>
        /// <param name="msg">The message to send.</param>
        private void SendMessage(string msg)
        {
            try
            {
                // Enqueue the message and immediately return, to avoid blocking the
                // WebRTC signaler thread which is typically invoking this method through
                // the PeerConnection signaling callbacks.
                Console.WriteLine($"[->] {msg}");
                _outgoingMessages.Add(msg);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception: {e.Message}");
                Environment.Exit(-1);
            }
        }

        private void PeerConnection_IceCandidateReadytoSend(string candidate, int sdpMlineindex, string sdpMid)
        {
            // See ProcessIncomingMessages() for the message format
            SendMessage($"ice\n{sdpMid}\n{sdpMlineindex}\n{candidate}\n\n");
        }

        private void PeerConnection_LocalSdpReadytoSend(string type, string sdp)
        {
            // See ProcessIncomingMessages() for the message format
            SendMessage($"sdp\n{type}\n{sdp}\n\n");
        }
    }
}