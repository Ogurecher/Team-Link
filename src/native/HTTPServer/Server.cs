using System;
using System.Net;
using System.Threading.Tasks;

namespace HTTPServer {
    class Server {

        private string baseURI;
        private HttpListener listener;
        private void setUpListener (string[] prefixes) {
            if (this.listener.IsListening) {
                Console.WriteLine("Another listener is already listening on {0}", this.listener.Prefixes);
                return;
            }

            if (!HttpListener.IsSupported) {
                Console.WriteLine("Windows XP SP2 or Server 2003 is required to use the HttpListener class.");
                return;
            }

            if (prefixes == null || prefixes.Length == 0)
                throw new ArgumentException("prefixes");

            this.listener = new HttpListener();

            foreach (string prefix in prefixes) {
                listener.Prefixes.Add(prefix);
            }

            listener.Start();

            Task listeningTask = Task.Run(async () => {
                while (true) {
                    await respond(this.listener);
                }
            });

            Console.WriteLine("Listening on {0}", prefixes);

            listeningTask.Wait();
        }

        private async Task respond (HttpListener listener) {
            try {
                Console.WriteLine("Waiting for requests");
                HttpListenerContext context = await listener.GetContextAsync();

                Console.WriteLine("Got request");
                HttpListenerRequest req = context.Request;
                HttpListenerResponse res = context.Response;

                string responseSting = "Hello response";
                byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseSting);

                res.ContentLength64 = buffer.Length;

                System.IO.Stream output = res.OutputStream;
                output.Write(buffer, 0, buffer.Length);

                output.Close();
            } catch (HttpListenerException e) {
                Console.WriteLine(e.Message);
                Console.WriteLine(e.StackTrace);
            }
        }

        public Server (string host, string port) {
            this.baseURI = String.Format("http://{0}:{1}", host, port);
            this.listener = new HttpListener();
        }

        public void listen () {
            string helloEndpoint = "/hello/";
            string helloPrefix = String.Concat(this.baseURI, helloEndpoint);

            string[] prefixes = {helloPrefix};

            this.setUpListener(prefixes);
        }

        public void close () {
            if (this.listener.IsListening) {
                Console.WriteLine("Stopping");
                this.listener.Close();
            }
        }
    }
}