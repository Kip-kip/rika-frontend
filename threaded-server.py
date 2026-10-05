#!/usr/bin/env python3
"""Threaded static server for the 19th Drive PoC (replaces single-threaded http.server)."""
import http.server
import socketserver

class Handler(http.server.SimpleHTTPRequestHandler):
    # per-connection read timeout so a stalled/idle client can never wedge a worker
    timeout = 15

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    with Server(("0.0.0.0", 3101), Handler) as httpd:
        httpd.serve_forever()
