#!/usr/bin/env python3
"""Convierte las lecciones de /contenido/*.md en js/contenido.js (el sitio se abre sin servidor).
Uso:  python build_contenido.py
"""
import json, pathlib

raiz = pathlib.Path(__file__).parent
archivos = sorted((raiz / "contenido").glob("*.md"))
datos = [{"file": a.name, "md": a.read_text(encoding="utf-8")} for a in archivos]
salida = "window.__LESSONS_MD = " + json.dumps(datos, ensure_ascii=False).replace("</", "<\\/") + ";\n"
(raiz / "js" / "contenido.js").write_text(salida, encoding="utf-8")
print(f"OK: {len(datos)} lecciones -> js/contenido.js")
