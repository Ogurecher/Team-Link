/*namespace MediaServer.Controllers
{
    using System;
    using System.IO;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using System.Net.Http;
    using System.Web;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.Http.Internal;

    [Route("websocket")]
    public class WebRTCSignalingController : Controller
    {
        [HttpGet]
        public async Task Get() // I MAY WANT TO RESTRICT ORIGINS LATER https://docs.microsoft.com/ru-ru/aspnet/core/fundamentals/websockets?view=aspnetcore-3.1#websocket-origin-restriction
        {
            var context = ControllerContext.HttpContext;
            if (context.WebSockets.IsWebSocketRequest)
            {
                WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                await Echo(webSocket);
            }
            else
            {
                context.Response.StatusCode = 400;
            }
        }

        private async Task Echo(WebSocket webSocket)
        {
            var buffer = new byte[1024 * 4];
            WebSocketReceiveResult result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            while (!result.CloseStatus.HasValue)
            {
                await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType, result.EndOfMessage, CancellationToken.None);

                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }
            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }

        
    }
}*/