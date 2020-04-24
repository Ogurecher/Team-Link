using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.HttpSys;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Graph.Communications.Common.Telemetry;

namespace MediaServer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.Write("Start");
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) 
        {
            IConfiguration configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            String[] urls = {"https://+:9441", "https://+:9442", "https://+:9444"};
            
            return WebHost.CreateDefaultBuilder(args)
                .UseConfiguration(configuration)
                //.UseUrls(urls)
                .UseStartup<Startup>();
        }
    }
}
