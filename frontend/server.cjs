const { createServer } = require("node:http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = "127.0.0.1";

const app = next({
  dev: false,
  hostname,
  port
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => handle(req, res))
      .listen(port, hostname, () => {
        console.log(`Medicare frontend running on ${hostname}:${port}`);
      });
  })
  .catch((error) => {
    console.error("Frontend startup failed:");
    console.error(error);
    process.exit(1);
  });
