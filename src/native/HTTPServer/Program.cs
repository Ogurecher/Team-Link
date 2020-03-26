using System;

namespace HTTPServer
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");

            Server server = new Server("localhost", "3001");
            server.listen();
        }
    }
}
