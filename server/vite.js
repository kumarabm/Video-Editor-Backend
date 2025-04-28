import path from "path";
import fs from "fs";

function log(message, source = "express") {
  console.log(`[${source}] ${message}`);
}

async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");

  try {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "spa",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }

      try {
        const htmlPath = path.resolve("./client/index.html");
        let html = fs.readFileSync(htmlPath, "utf-8");

        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        return next(e);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

async function serveStatic(app) {
  const { default: staticMiddleware } = await import("serve-static");
  const dist = path.resolve("./client/dist");
  app.use("/", staticMiddleware(dist, { index: ["index.html"] }));
  app.use("*", (req, res) => {
    try {
      const htmlPath = path.resolve(path.join(dist, "index.html"));
      const html = fs.readFileSync(htmlPath, "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      console.error(e);
      res.status(500).end();
    }
  });
}

export {
  log,
  setupVite,
  serveStatic
};