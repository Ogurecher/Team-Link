namespace MediaServer.Controllers
{
    public static class HttpRouteConstants
    {
        public const string CallSignalingRoutePrefix = "api";

        public const string OnIncomingRequestRoute = "calls";

        public const string OnJoinCallRoute = "joinCall";

        public const string OnMakeCallRoute = "makeCall";

        public const string OnTransferCallRoute = CallRoute + "transfer";

        public const string AnswerWith = "answerWith";

        public const string Calls = "calls/";

        public const string Logs = "logs/";

        public const string CallIdTemplate = "{callId}/";

        public const string CallRoute = Calls + CallIdTemplate;

        public const string OnSnapshotRoute = CallRoute + "scr";

        public const string OnHueRoute = CallRoute + "hue";
    }
}
