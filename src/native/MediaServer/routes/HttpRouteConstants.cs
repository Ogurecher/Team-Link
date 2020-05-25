namespace MediaServer.Controllers
{
    public static class HttpRouteConstants
    {
        public const string CallSignalingRoutePrefix = "api";

        public const string OnIncomingRequestRoute = "calls";

        public const string OnJoinCallRoute = "joinCall";

        public const string WebSocketRoute = "/websocket";

        public const string Calls = "calls/";

        public const string Logs = "logs/";

        public const string CallIdTemplate = "{callId}/";

        public const string CallRoute = Calls + CallIdTemplate;
    }
}
