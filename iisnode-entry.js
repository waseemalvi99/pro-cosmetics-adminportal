const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const iisPort = process.env.PORT;
const internalPort = 3210;

process.env.PORT = String(internalPort);
process.env.HOSTNAME = "127.0.0.1";
process.env.NODE_ENV = "production";

const child = spawn(process.execPath, [path.join(__dirname, "server.js")], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(internalPort) },
});

child.on("error", (err) => {
  console.error("Failed to start Next.js server:", err);
  process.exit(1);
});

function tryConnect(retries) {
  const req = http.get(`http://127.0.0.1:${internalPort}/`, (res) => {
    res.resume();
    startProxy();
  });
  req.on("error", () => {
    if (retries > 0) {
      setTimeout(() => tryConnect(retries - 1), 500);
    } else {
      console.error("Next.js server did not start in time");
      process.exit(1);
    }
  });
  req.end();
}

function startProxy() {
  const proxy = http.createServer((req, res) => {
    const options = {
      hostname: "127.0.0.1",
      port: internalPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", (err) => {
      console.error("Proxy error:", err.message);
      res.writeHead(502);
      res.end("Bad Gateway");
    });
    req.pipe(proxyReq, { end: true });
  });

  proxy.listen(iisPort, () => {
    console.log("IIS proxy listening on", iisPort, "-> Next.js on", internalPort);
  });
}

tryConnect(30);
