using System;

namespace HTTPServer
{
    class Program
    {
        static void Main(string[] args)
        {
            Server server = new Server("localhost", "3001");
            server.listen();
            
            server.close();

            server.listen();
        }
    }
}
