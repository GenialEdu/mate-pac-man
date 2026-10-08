"""Demo del generador aleatorio Mate Pac-Man. Uso: ./.venv/bin/python demo_math.py"""
from pacman.math_quiz import generate

for nivel in range(6):
    print(f"\n=== NIVEL {nivel} ===")
    for sub in range(1, 6):
        q = generate(nivel, sub)
        print(f"[{nivel}-{sub}] {q.prompt}  opciones={q.choices}  correcta={q.correct}")
