#!/usr/bin/env python3
"""Threaded static server (port 3101). Serves the Rika platform with
explicit cache headers so browsers never heuristic-cache a stale asset
(e.g. a 404 from before a file existed) — which broke the shared booking
modal for returning visitors."""
import http.server
import socketserver


class Handler(http.server.SimpleHTTPRequestHandler):
    # per-connection read timeout so a stalled/idle client can never wedge a worker
    timeout = 15

    def end_headers(self):
        # Force revalidation on every request: without explicit headers the
        # browser applies heuristic caching (5% of Last-Modified age) and can
        # pin a stale 404 or old file forever.
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server(("0.0.0.0", 3101), Handler) as httpd:
        httpd.serve_forever()
