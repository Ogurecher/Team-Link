using System;
using System.Threading.Tasks;

namespace HTTPServer
{
    class Program
    {
        static void Main(string[] args)
        {
            Server server = new Server("localhost", "9442");
            Task listeningTask = server.listen();

            if (server.isListening()) {
                listeningTask.Wait();
            };
        }
    }
}
