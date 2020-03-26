using System;
using System.Net;

namespace HTTPServer {
    class Server {

        private string baseURI;
        private HttpListener listener;
        private void setUpListener (string[] prefixes) {
            if (!HttpListener.IsSupported){
                Console.WriteLine ("Windows XP SP2 or Server 2003 is required to use the HttpListener class.");
                return;
            }

            if (prefixes == null || prefixes.Length == 0)
                throw new ArgumentException("prefixes");

            this.listener = new HttpListener();

            foreach (string prefix in prefixes) {
                listener.Prefixes.Add(prefix);
            }

            listener.Start();
            Console.WriteLine("Listening on {0}", prefixes);

            while (true) {
                Console.WriteLine("Waiting for client...");
                HttpListenerContext context = listener.GetContext();

                Console.WriteLine("Got client");
                HttpListenerRequest req = context.Request;
                HttpListenerResponse res = context.Response;

                string responseSting = "Hello response";
                byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseSting);

                res.ContentLength64 = buffer.Length;

                System.IO.Stream output = res.OutputStream;
                output.Write(buffer, 0, buffer.Length);

                output.Close();
            }
        }
        public Server (string host, string port) {
            this.baseURI = String.Format("http://{0}:{1}", host, port);
        }

        public void listen () {
            string helloEndpoint = "/hello/";
            string helloPrefix = String.Concat(this.baseURI, helloEndpoint);

            string[] prefixes = {helloPrefix};

            this.setUpListener(prefixes);
        }

        public void close () {
            Console.WriteLine("Stopping");
            this.listener.Stop();
        }
    }
}