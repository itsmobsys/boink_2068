// Minimal HTTP layer: GET /health (public), GET /presence (Bearer),
// everything else 404. No framework, no router, no dependencies.
// getPresence is injected so tests drive the routes without Discord.

import http from "node:http";
import { buildResponse, isAuthorized } from "./presence.js";

export function createServer({ getPresence, secret, logger = () => {} }) {
  const server = http.createServer((req, res) => {
    const send = (code, body) => {
      const payload = JSON.stringify(body);
      res.writeHead(code, {
        "content-type": "application/json; charset=utf-8",
        "content-length": Buffer.byteLength(payload),
        "cache-control": "no-store",
      });
      res.end(payload);
    };

    let pathname = null;
    try {
      pathname = new URL(req.url || "/", "http://x").pathname;
    } catch {
      send(400, { error: "bad-request" });
      return;
    }

    if (req.method !== "GET") {
      send(404, { error: "not-found" });
      return;
    }

    if (pathname === "/health") {
      logger("[http] GET /health 200");
      send(200, { ok: true });
      return;
    }

    if (pathname === "/presence") {
      if (!isAuthorized(req.headers.authorization, secret)) {
        send(401, { error: "unauthorized" });
        return;
      }
      logger("[http] GET /presence 200");
      send(200, buildResponse(getPresence()));
      return;
    }

    send(404, { error: "not-found" });
  });

  return server;
}
