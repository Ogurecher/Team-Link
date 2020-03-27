using System;
using System.Threading.Tasks;

namespace HTTPServer
{
    class Program
    {
        static void Main(string[] args)
        {
            Server server = new Server("localhost", "3001");
            Task listeningTask1 = server.listen();

            System.Threading.Thread.Sleep(3000);

            server.close();
            
            
            if (server.isListening()) {
                listeningTask1.Wait();
            };

            Task listeningTask2 = server.listen();

            if (server.isListening()) {
                listeningTask2.Wait();
            };
        }
    }
}
