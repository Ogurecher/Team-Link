namespace MediaServer
{
    public static class Config
    {
        public const int MEDIA_PORT = 8445;

        public const int END_CALL_TIMER = 1000 * 60 * 5;

        public static class AudioSettings
        {
            public const int MAX_FRAMES_TO_SEND = 2;

            public const int OUTGOING_SAMPLE_RATE = 16000;

            public const int OUTGOING_BITS_PER_SAMPLE = 16;

            public const int OUTGOING_CHANNEL_COUNT = 1;

            public const int WEBRTC_SAMPLE_RATE = 16000;

            public const int WAV_HEADER_SIZE = 44;

            public const int MAX_AUDIO_FRAMES_IN_QUEUE = 6;
        }

        public static class VideoSettings
        {
            public const double ASPECT_RATIO = (double)9 / (double)16;
        }

        public const int SIGNALING_BUFFER_SIZE = 1024 * 25;

        public const string CALLBACK_URI = "https://teamlink_main.ngrok.io/callback";

        public const string STUN_URI = "stun:stun.l.google.com:19302";
    }
}
