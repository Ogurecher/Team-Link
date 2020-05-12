using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace MediaServer.Controllers
{
    [Route("hello")]
    [ApiController]
    public class HelloController : Controller
    {
        // GET /hello
        [HttpGet]
        public ActionResult<string> Get()
        {
            return "hello";
        }
    }
}
