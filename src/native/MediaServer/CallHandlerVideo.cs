namespace MediaServer.MediaBot
{
    using System;
    using System.Runtime.InteropServices;
    using Microsoft.Graph.Communications.Calls;
    using Microsoft.Graph.Communications.Calls.Media;
    using Microsoft.Skype.Bots.Media;
    using Microsoft.MixedReality.WebRTC;
    using MediaServer.Converters;
    using MediaServer.Util.VideoFormat;

    public class CallHandlerVideo
    {
        public RemoteVideoTrack clientVideoTrack;

        private byte[] nv12VideoFrameToSend;

        private DateTime lastVideoSentToClientTimeUtc = DateTime.MinValue;

        private DateTime lastVideoSentToTeamsTimeUtc = DateTime.MinValue;

        private ICall Call;

        public CallHandlerVideo(ICall call)
        {
            this.Call = call;
        }

        public void OnClientVideoTrackAdded(RemoteVideoTrack track)
        {
            this.clientVideoTrack = track;
            this.clientVideoTrack.I420AVideoFrameReady += this.OnClientVideoReceived;
        }

        public void OnClientVideoTrackRemoved(Transceiver transceiver, RemoteVideoTrack track)
        {
            this.clientVideoTrack.I420AVideoFrameReady -= this.OnClientVideoReceived;
            this.clientVideoTrack = null;
        }

        public void OnClientVideoReceived(I420AVideoFrame frame)
        {
            if (DateTime.Now > this.lastVideoSentToClientTimeUtc + TimeSpan.FromMilliseconds(33))
            {
                this.lastVideoSentToClientTimeUtc = DateTime.Now;

                byte[] i420Frame = new byte[frame.width * frame.height * 12 / 8];
                frame.CopyTo(i420Frame);

                byte[] nv12Frame = VideoConverter.I420ToNV12(i420Frame);

                VideoFormat sendVideoFormat = VideoFormatUtil.GetSendVideoFormat((int)frame.height, (int)frame.width);
                var videoSendBuffer = new VideoSendBuffer(nv12Frame, (uint)nv12Frame.Length, sendVideoFormat);
                this.Call.GetLocalMediaSession().VideoSocket.Send(videoSendBuffer);
            }
        }

        public void CustomI420AFrameCallback(in FrameRequest request)
        {
            if (this.nv12VideoFrameToSend != null)
            {
                byte[] i420Frame = VideoConverter.NV12ToI420(this.nv12VideoFrameToSend);
                
                IntPtr dataY = Marshal.AllocHGlobal(i420Frame.Length);
                Marshal.Copy(i420Frame, 0, dataY, i420Frame.Length);

                int pixelCount = this.nv12VideoFrameToSend.Length * 8 / 12;
                int frameWidth = (int)Math.Sqrt(pixelCount / Config.VideoSettings.ASPECT_RATIO);
                int frameHeight = pixelCount / frameWidth;
                
                var frame = new I420AVideoFrame
                {
                    dataY = dataY,
                    dataU = dataY + pixelCount,
                    dataV = dataY + pixelCount / 4 * 5,
                    dataA = IntPtr.Zero,
                    strideY = frameWidth,
                    strideU = frameWidth / 2,
                    strideV = frameWidth / 2,
                    strideA = 0,
                    width = (uint)frameWidth,
                    height = (uint)frameHeight
                };
                request.CompleteRequest(frame);
                
                Marshal.FreeHGlobal(dataY);
            }
        }

        public void OnTeamsVideoReceived(object sender, VideoMediaReceivedEventArgs e)
        {
            Console.WriteLine("MEDIA RECEIVED");
            try
            {
                if (DateTime.Now > this.lastVideoSentToTeamsTimeUtc + TimeSpan.FromMilliseconds(33))
                {
                    this.lastVideoSentToTeamsTimeUtc = DateTime.Now;

                    byte[] buffer = new byte[e.Buffer.VideoFormat.Width * e.Buffer.VideoFormat.Height * 12 / 8];
                    Marshal.Copy(e.Buffer.Data, buffer, 0, buffer.Length);

                    this.nv12VideoFrameToSend = buffer;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            e.Buffer.Dispose();
        }
    }
}
