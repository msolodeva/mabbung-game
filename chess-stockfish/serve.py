#!/usr/bin/env python3
"""Development server for the Stockfish web UI.

Serves static assets from ./static and exposes a small JSON API that
interfaces with the bundled macOS Stockfish engine.
"""

from __future__ import annotations

import atexit
import json
import os
import pathlib
import subprocess
import threading
import traceback
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict, Optional

BASE_DIR = pathlib.Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ENGINE_PATH = BASE_DIR / "bin" / "stockfish-mac"


class StockfishEngine:
    """Minimal UCI controller around the Stockfish binary."""

    def __init__(self, engine_path: pathlib.Path):
        self._engine_path = engine_path
        self._lock = threading.Lock()
        self._process: Optional[subprocess.Popen[str]] = None
        self._start_engine()

    # ------------------------------------------------------------------
    def _start_engine(self) -> None:
        if not self._engine_path.exists():
            raise FileNotFoundError(
                f"Stockfish binary not found at {self._engine_path}.\n"
                "Make sure you executed the download step successfully."
            )

        self._process = subprocess.Popen(
            [str(self._engine_path)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self._uci_handshake()

    # ------------------------------------------------------------------
    def _uci_handshake(self) -> None:
        assert self._process is not None and self._process.stdin and self._process.stdout
        self._write_line("uci")
        for line in self._iter_stdout():
            if line.strip() == "uciok":
                break
        self._write_line("isready")
        for line in self._iter_stdout():
            if line.strip() == "readyok":
                break

    # ------------------------------------------------------------------
    def _iter_stdout(self):
        assert self._process is not None and self._process.stdout is not None
        while True:
            line = self._process.stdout.readline()
            if not line:
                raise RuntimeError("Stockfish engine closed unexpectedly")
            yield line

    # ------------------------------------------------------------------
    def _write_line(self, command: str) -> None:
        assert self._process is not None and self._process.stdin is not None
        self._process.stdin.write(command + "\n")
        self._process.stdin.flush()

    # ------------------------------------------------------------------
    def ensure_running(self) -> None:
        if self._process is None or self._process.poll() is not None:
            self._start_engine()

    # ------------------------------------------------------------------
    def best_move(
        self,
        fen: str,
        skill: int = 20,
        depth: int = 18,
        movetime: Optional[int] = None,
    ) -> Dict[str, Optional[str]]:
        with self._lock:
            self.ensure_running()
            skill = max(0, min(20, int(skill)))
            depth = max(1, int(depth))
            if movetime is not None:
                movetime = max(100, int(movetime))

            # Add human-like mistakes based on skill level
            import random
            mistake_probability = max(0.3, (20 - skill) / 20 * 0.9)  # 30% at skill 20, 90% at skill 0
            
            if random.random() < mistake_probability:
                # Make a suboptimal move by using much lower depth
                actual_depth = max(1, depth // 5)
                # Add significant randomness to skill
                actual_skill = max(0, skill - random.randint(5, 15))
                # Consider multiple lines to pick suboptimal moves
                multipv = random.randint(3, 5)
            else:
                actual_depth = max(1, depth // 2)
                actual_skill = max(0, skill - random.randint(0, 5))
                multipv = random.randint(1, 3)

            # Enable UCI_LimitStrength for more human-like play
            self._write_line("setoption name UCI_LimitStrength value true")
            # Calculate Elo from skill (rough approximation)
            elo = 400 + (actual_skill * 122)
            self._write_line(f"setoption name UCI_Elo value {elo}")
            self._write_line(f"setoption name Skill Level value {actual_skill}")
            self._write_line(f"setoption name MultiPV value {multipv}")
            self._write_line("ucinewgame")
            self._write_line(f"position fen {fen}")
            if movetime:
                self._write_line(f"go movetime {movetime}")
            else:
                self._write_line(f"go depth {actual_depth}")

            last_info: Dict[str, Optional[str]] = {
                "depth": None,
                "seldepth": None,
                "score": None,
                "mate": None,
                "nps": None,
                "pv": None,
            }

            for raw in self._iter_stdout():
                line = raw.strip()
                if line.startswith("info "):
                    self._parse_info_line(line, last_info)
                elif line.startswith("bestmove"):
                    parts = line.split()
                    move = parts[1] if len(parts) > 1 else None
                    ponder = parts[3] if len(parts) > 3 and parts[2] == "ponder" else None
                    return {
                        "move": move,
                        "ponder": ponder,
                        "info": last_info,
                    }

            raise RuntimeError("Failed to receive bestmove from Stockfish")

    # ------------------------------------------------------------------
    @staticmethod
    def _parse_info_line(line: str, target: Dict[str, Optional[str]]) -> None:
        tokens = line.split()
        it = iter(range(len(tokens)))
        for idx in it:
            token = tokens[idx]
            if token == "depth" and idx + 1 < len(tokens):
                target["depth"] = tokens[idx + 1]
            elif token == "seldepth" and idx + 1 < len(tokens):
                target["seldepth"] = tokens[idx + 1]
            elif token == "score" and idx + 2 < len(tokens):
                kind = tokens[idx + 1]
                value = tokens[idx + 2]
                if kind == "cp":
                    try:
                        target["score"] = str(round(int(value) / 100, 2))
                        target["mate"] = None
                    except ValueError:
                        target["score"] = value
                elif kind == "mate":
                    target["mate"] = value
                    target["score"] = None
            elif token == "nps" and idx + 1 < len(tokens):
                target["nps"] = tokens[idx + 1]
            elif token == "pv" and idx + 1 < len(tokens):
                target["pv"] = " ".join(tokens[idx + 1 :])
                break

    # ------------------------------------------------------------------
    def shutdown(self) -> None:
        proc = self._process
        if proc and proc.poll() is None:
            try:
                proc.stdin.write('quit\n')
                proc.stdin.flush()
            except Exception:
                pass
            try:
                proc.communicate(timeout=1)
            except Exception:
                proc.kill()
        self._process = None


ENGINE = StockfishEngine(ENGINE_PATH)
atexit.register(ENGINE.shutdown)


class ChessHTTPRequestHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".css": "text/css",
        ".wasm": "application/wasm",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    # ------------------------------------------------------------------
    def do_GET(self):  # noqa: N802
        if self.path in {"/", ""}:
            self.path = "/index.html"
        return super().do_GET()

    # ------------------------------------------------------------------
    def do_POST(self):  # noqa: N802
        if self.path == "/api/best-move":
            self.handle_best_move()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    # ------------------------------------------------------------------
    def handle_best_move(self) -> None:
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = self.rfile.read(length).decode("utf-8")
            data = json.loads(payload)
            fen = data["fen"]
            skill = int(data.get("skill", 20))
            depth = int(data.get("depth", 18))
            movetime = data.get("movetime")
            result = ENGINE.best_move(fen, skill=skill, depth=depth, movetime=movetime)
            self._send_json(result)
        except Exception as exc:  # pylint: disable=broad-except
            traceback.print_exc()
            self._send_json({"error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    # ------------------------------------------------------------------
    def _send_json(self, data: Dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(data).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    # ------------------------------------------------------------------
    def end_headers(self):  # noqa: N802
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def run_server(port: int = 8000) -> None:
    os.chdir(BASE_DIR.parent)
    address = ("", port)
    httpd = ThreadingHTTPServer(address, ChessHTTPRequestHandler)
    print(f"Serving on http://localhost:{port}/ (static root: {STATIC_DIR})")
    print("Open http://localhost:%d/index.html" % port)
    httpd.serve_forever()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run the Stockfish web UI server")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind (default: 8000)")
    args = parser.parse_args()
    run_server(args.port)
