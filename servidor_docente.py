#!/usr/bin/env python3
"""Mate Pac-Man — Servidor de aula (solo biblioteca estándar, sin instalar nada).

La PC del docente hace dos trabajos:
  1. Sirve el juego a los celulares/tablets del salón por WiFi local.
  2. Recibe los resultados de cada partida y los guarda en resultados.json.

Uso:
  python3 servidor_docente.py [puerto]     (puerto por defecto: 8000)

  - Alumnos abren:  http://IP-DEL-DOCENTE:8000
  - Docente abre:   http://IP-DEL-DOCENTE:8000/docente   (pide PIN)

El PIN evita que un alumno curioso borre resultados o invente tareas;
no es seguridad real: es red local de confianza.
"""
import json
import os
import re
import socket
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

DOCENTE_PIN = "1234"  # <-- el docente cambia este PIN aquí

BASE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(BASE, "web")
TAREAS = os.path.join(BASE, "tareas.json")
RESULTADOS = os.path.join(BASE, "resultados.json")
CODE_RE = re.compile(r"^\d{1,2}-\d{1,2}(?:-[A-Za-z]+)?$")
MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8", ".txt": "text/plain; charset=utf-8",
        ".json": "application/json"}


def load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, type(default)) else default
    except (OSError, ValueError):
        return default


def save(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


tasks = load(TAREAS, [])
results = load(RESULTADOS, [])
lock = threading.Lock()


def valid_task(t):
    return (isinstance(t, dict) and isinstance(t.get("code"), str)
            and CODE_RE.match(t["code"].strip())
            and isinstance(t.get("level"), int) and 0 <= t["level"] <= 25
            and isinstance(t.get("goal"), int) and 1 <= t["goal"] <= 30)


def valid_result(r):
    try:
        p = r["player"]
        return (isinstance(r, dict) and isinstance(p, dict)
                and isinstance(p.get("name", ""), str)
                and isinstance(r.get("levelKey"), int) and 0 <= r["levelKey"] <= 25
                and isinstance(r.get("ok"), int) and isinstance(r.get("goal"), int)
                and isinstance(r.get("score"), int) and isinstance(r.get("timeSec"), int)
                and isinstance(r.get("taskCode", ""), str))
    except (KeyError, TypeError):
        return False


class Handler(BaseHTTPRequestHandler):
    server_version = "MatePacManAula/1.0"

    def log_message(self, fmt, *args):
        print("%s %s" % (self.command, self.path.split("?")[0]))

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _static(self, path):
        if path in ("/", "/index.html"):
            path = "/index.html"
        elif path in ("/docente", "/docente.html"):
            path = "/docente.html"
        if ".." in path or path.startswith("~"):
            return self._json({"error": "ruta inválida"}, 400)
        full = os.path.join(WEB, path.lstrip("/"))
        if not os.path.isfile(full):
            return self._json({"error": "no encontrado"}, 404)
        ext = os.path.splitext(full)[1]
        try:
            with open(full, "rb") as f:
                body = f.read()
        except OSError:
            return self._json({"error": "no se puede leer"}, 500)
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            n = 0
        if n <= 0 or n > 100000:
            return None
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except ValueError:
            return None

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/ping":
            return self._json({"ok": True, "juego": "mate-pac-man"})
        if u.path == "/api/tasks":
            with lock:
                return self._json({"tasks": tasks})
        if u.path == "/api/results":
            pin = parse_qs(u.query).get("pin", [""])[0]
            if pin != DOCENTE_PIN:
                return self._json({"error": "PIN incorrecto"}, 403)
            with lock:
                return self._json({"results": results})
        return self._static(u.path)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/task":
            data = self._body() or {}
            if data.get("pin") != DOCENTE_PIN:
                return self._json({"error": "PIN incorrecto"}, 403)
            t = data.get("task")
            if not valid_task(t):
                return self._json({"error": "tarea inválida (código nivel-meta, ej. 8-7)"}, 400)
            t = {"code": t["code"].strip(), "level": t["level"], "goal": t["goal"],
                 "flags": str(t.get("flags", "")).upper()[:4],
                 "nota": str(t.get("nota", ""))[:120]}
            with lock:
                tasks[:] = [x for x in tasks if x["code"] != t["code"]] + [t]
                save(TAREAS, tasks)
            return self._json({"ok": True, "task": t})
        if u.path == "/api/result":
            r = self._body()
            if not valid_result(r):
                return self._json({"error": "resultado inválido"}, 400)
            r = {"id": str(r.get("id", ""))[:24],
                 "ts": r.get("ts", "")[:30] or "sin-fecha",
                 "player": {"name": r["player"].get("name", "")[:16] or "Anónimo",
                            "avatar": str(r["player"].get("avatar", ""))[:2]},
                 "taskCode": r.get("taskCode", "")[:12],
                 "levelKey": r["levelKey"], "level": str(r.get("level", ""))[:40],
                 "ok": r["ok"], "goal": r["goal"], "score": r["score"],
                 "timeSec": r["timeSec"], "won": bool(r.get("won"))}
            with lock:
                if r["id"] and any(x.get("id") == r["id"] for x in results):
                    return self._json({"ok": True, "dup": True})
                results.append(r)
                del results[:-1000]
                save(RESULTADOS, results)
            return self._json({"ok": True})
        return self._json({"error": "no encontrado"}, 404)

    def do_DELETE(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if q.get("pin", [""])[0] != DOCENTE_PIN:
            return self._json({"error": "PIN incorrecto"}, 403)
        with lock:
            if u.path == "/api/task":
                code = q.get("code", [""])[0]
                tasks[:] = [x for x in tasks if x["code"] != code]
                save(TAREAS, tasks)
                return self._json({"ok": True})
            if u.path == "/api/results":
                del results[:]
                save(RESULTADOS, results)
                return self._json({"ok": True})
        return self._json({"error": "no encontrado"}, 404)


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # UDP: no envía nada, solo elige interfaz
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "localhost"


def main():
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    ip = lan_ip()
    print("Mate Pac-Man aula en marcha")
    print("  Alumnos (celular/tablet/PC): http://%s:%d" % (ip, port))
    print("  Docente (panel + PIN):       http://%s:%d/docente" % (ip, port))
    print("  PIN actual: %s  (cámbialo en DOCENTE_PIN dentro de %s)" % (DOCENTE_PIN, __file__))
    print("Ctrl+C para detener. Resultados en resultados.json, tareas en tareas.json.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nApagado.")


if __name__ == "__main__":
    main()
