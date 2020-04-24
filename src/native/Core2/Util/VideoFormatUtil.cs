namespace MediaServer.Util.VideoFormat
{
    using System.Runtime.InteropServices;
    using Microsoft.Skype.Bots.Media;

    /// <summary>
    /// The utility class.
    /// </summary>
    internal static class VideoFormatUtil
    {
        public static VideoFormat GetSendVideoFormat(this VideoFormat videoFormat)
        {
            VideoFormat sendVideoFormat;
            switch (videoFormat.Width)
            {
                case 270:
                    sendVideoFormat = VideoFormat.NV12_270x480_15Fps;
                    break;

                case 320:
                    sendVideoFormat = VideoFormat.NV12_320x180_15Fps;
                    break;

                case 360:
                    sendVideoFormat = VideoFormat.NV12_360x640_15Fps;
                    break;

                case 424:
                    sendVideoFormat = VideoFormat.NV12_424x240_15Fps;
                    break;

                case 480:
                    if (videoFormat.Height == 270)
                    {
                        sendVideoFormat = VideoFormat.NV12_480x270_15Fps;
                        break;
                    }

                    sendVideoFormat = VideoFormat.NV12_480x848_30Fps;
                    break;

                case 640:
                    sendVideoFormat = VideoFormat.NV12_640x360_15Fps;
                    break;

                case 720:
                    sendVideoFormat = VideoFormat.NV12_720x1280_30Fps;
                    break;

                case 848:
                    sendVideoFormat = VideoFormat.NV12_848x480_30Fps;
                    break;

                case 960:
                    sendVideoFormat = VideoFormat.NV12_960x540_30Fps;
                    break;

                case 1280:
                    sendVideoFormat = VideoFormat.NV12_1280x720_30Fps;
                    break;

                case 1920:
                    sendVideoFormat = VideoFormat.NV12_1920x1080_30Fps;
                    break;

                default:
                    sendVideoFormat = VideoFormat.NV12_424x240_15Fps;
                    break;
            }

            return sendVideoFormat;
        }
    }
}