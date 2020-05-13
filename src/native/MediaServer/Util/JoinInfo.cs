namespace MediaServer.Util.Meetings
{
    using System;
    using System.IO;
    using System.Net;
    using System.Runtime.Serialization;
    using System.Runtime.Serialization.Json;
    using System.Text;
    using System.Text.RegularExpressions;
    using Microsoft.Graph;

    public class JoinInfo
    {
        public static (ChatInfo, MeetingInfo) ParseJoinURL(string joinURL)
        {
            var decodedURL = WebUtility.UrlDecode(joinURL);

            var regex = new Regex("https://teams\\.microsoft\\.com.*/(?<thread>[^/]+)/(?<message>[^/]+)\\?context=(?<context>{.*})");
            var match = regex.Match(decodedURL);
            if (!match.Success)
            {
                throw new ArgumentException($"Join URL cannot be parsed: {joinURL}.", nameof(joinURL));
            }

            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(match.Groups["context"].Value)))
            {
                var ctxt = (Context)new DataContractJsonSerializer(typeof(Context)).ReadObject(stream);
                var chatInfo = new ChatInfo
                {
                    ThreadId = match.Groups["thread"].Value,
                    MessageId = match.Groups["message"].Value,
                    ReplyChainMessageId = ctxt.MessageId,
                };

                var meetingInfo = new OrganizerMeetingInfo
                {
                    Organizer = new IdentitySet
                    {
                        User = new Identity { Id = ctxt.Oid },
                    },
                };
                meetingInfo.Organizer.User.SetTenantId(ctxt.Tid);

                return (chatInfo, meetingInfo);
            }
        }

        [DataContract]
        private class Context
        {
            [DataMember]
            public string Tid { get; set; }

            [DataMember]
            public string Oid { get; set; }

            [DataMember]
            public string MessageId { get; set; }
        }
    }
}
