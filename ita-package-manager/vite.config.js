import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import http from "node:http";
// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the Vite server.
// The CLI will eventually stop passing in HOST,
// so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

// Shopify CLI picks a new random port every time you run `shopify app dev`.
// This small plugin opens a FIXED port (3100) that passes everything to the real one,
// so the website can always call http://localhost:3100/api/booking.
// Set ITA_FIXED_PORT=0 in the terminal to switch this helper off.
const FIXED_API_PORT = Number(process.env.ITA_FIXED_PORT ?? 3100);
const fixedApiPort = () => ({
  name: "ita-fixed-api-port",
  apply: "serve",
  configureServer(server) {
    if (!FIXED_API_PORT) return;
    server.httpServer?.once("listening", () => {
      const address = server.httpServer.address();
      if (!address || typeof address === "string") return;
      const realPort = address.port;
      // Vite may listen on IPv6 (::1) on Windows, so connect to the exact address it uses.
      const realHost = address.address === "::" ? "::1" : address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
      const forwarder = http.createServer((req, res) => {
        const upstream = http.request(
          { host: realHost, port: realPort, path: req.url, method: req.method, headers: req.headers, agent: false, timeout: 30000 },
          (up) => {
            res.writeHead(up.statusCode || 502, up.headers);
            up.on("error", () => res.destroy());
            up.pipe(res);
          },
        );
        const stop = () => upstream.destroy();
        upstream.on("timeout", stop);
        upstream.on("error", (error) => {
          if (res.headersSent) return res.destroy();
          res.writeHead(502);
          res.end(`ITA dev forwarder: app is not ready (${error.code || error.message})`);
        });
        req.on("error", stop);
        res.on("close", () => { if (!res.writableEnded) stop(); });
        req.pipe(upstream);
      });
      forwarder.on("clientError", (_error, socket) => socket.destroy());
      forwarder.on("error", (error) =>
        console.warn(`[ita] Fixed port ${FIXED_API_PORT} is not available: ${error.message}`),
      );
      forwarder.listen(FIXED_API_PORT, () =>
        console.log(`[ita] Booking API is also on http://localhost:${FIXED_API_PORT} -> ${realHost}:${realPort}`),
      );
      const closeAll = () => { try { forwarder.closeAllConnections?.(); forwarder.close(); } catch {} };
      server.httpServer.once("close", closeAll);
      process.once("exit", closeAll);
    });
  },
});

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")

  .hostname;
let hmrConfig;

if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
 plugins: [
  tailwindcss(),
  fixedApiPort(),
  reactRouter(),
  tsconfigPaths(),
],
  resolve: {
    // One copy of React only (fixes "Cannot read properties of null (reading 'useContext')")
    dedupe: ["react", "react-dom"],
  },
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react"],
  },
});