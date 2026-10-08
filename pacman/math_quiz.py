"""Mate Pac-Man - Generador aleatorio de preguntas.

Niveles (secundaria / bachillerato):
  0 = Super facil (tutorial)
  1 = Aritmetica
  2 = Fracciones
  3 = Ley de los signos / enteros / potencias
  4 = Algebra
  5 = Trigonometria / Geometria

Cada nivel tiene subniveles 1..5 que suben:
  rango numerico -> nº operandos -> velocidad fantasma -> menos tiempo.
El juego llama a `generate(nivel, subnivel)` cada vez que necesita
una pregunta (pellet-respuesta o choque con fantasma).
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass
from fractions import Fraction


@dataclass
class Question:
    prompt: str
    choices: list[str]
    correct: str
    nivel: int
    subnivel: int

    @property
    def correct_index(self) -> int:
        return self.choices.index(self.correct)


def _make_choices(correct: str, distractores: list[str]) -> list[str]:
    pool = []
    for d in distractores:
        if d != correct and d not in pool:
            pool.append(d)
    # relleno de seguridad para garantizar siempre 4 opciones
    extra = 1
    while len(pool) < 3:
        cand = f"{correct} ({extra})" if False else None
        # para numericos genera vecinos, para texto genera variante
        try:
            # intenta vecino entero
            v = int(correct) + extra * 7
            cand = str(v)
        except ValueError:
            try:
                # fraccion a/b -> varia numerador
                if "/" in correct:
                    num, den = correct.split("/")
                    cand = f"{int(num)+extra}/{den}"
                else:
                    cand = f"{correct}′"
            except Exception:
                cand = f"opción {extra}"
        if cand != correct and cand not in pool:
            pool.append(cand)
        extra += 1
    random.shuffle(pool)
    choices = [correct] + pool[:3]
    random.shuffle(choices)
    return choices


def _int_choices(correct: int, n: int = 3, radio: int = 3) -> list[str]:
    cands = set()
    while len(cands) < 10:
        delta = random.randint(-radio - 2, radio + 2)
        if delta == 0:
            continue
        cands.add(correct + delta)
        cands.add(correct + delta * 10 // 10)
    # errores tipicos: signo cambiado, +-1, +-10, doble
    for err in (-correct, correct + 1, correct - 1, correct + 10, correct - 10):
        cands.add(err)
    cands.discard(correct)
    return _make_choices(str(correct), [str(c) for c in cands])


# ---------------- Nivel 0: super facil ----------------

def gen_n0(sub: int = 1) -> Question:
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    if random.random() < 0.7 or sub <= 2:
        prompt = f"{a} + {b} = ?"
        return Question(prompt, _int_choices(a + b), str(a + b), 0, sub)
    # resta sin negativos
    a, b = max(a, b), min(a, b)
    prompt = f"{a} - {b} = ?"
    return Question(prompt, _int_choices(a - b), str(a - b), 0, sub)


# ---------------- Nivel 1: aritmetica ----------------

def gen_n1(sub: int) -> Question:
    if sub == 1:  # suma 1-10, 2 operandos
        a, b = random.randint(1, 10), random.randint(1, 10)
        return Question(f"{a} + {b} = ?", _int_choices(a + b), str(a + b), 1, sub)
    if sub == 2:  # resta 1-10
        a, b = random.randint(1, 10), random.randint(1, 10)
        a, b = max(a, b), min(a, b)
        return Question(f"{a} - {b} = ?", _int_choices(a - b), str(a - b), 1, sub)
    if sub == 3:  # 3 operandos 1-20
        a, b, c = (random.randint(1, 20) for _ in range(3))
        op1, op2 = random.choice(["+", "-"]), random.choice(["+", "-"])
        r = eval(f"{a}{op1}{b}{op2}{c}")
        return Question(f"{a} {op1} {b} {op2} {c} = ?", _int_choices(r, radio=5), str(r), 1, sub)
    if sub == 4:  # mult + division exacta
        if random.random() < 0.5:
            a, b = random.randint(2, 10), random.randint(2, 10)
            return Question(f"{a} x {b} = ?", _int_choices(a * b, radio=8), str(a * b), 1, sub)
        b = random.randint(2, 10)
        r = random.randint(2, 10)
        a = b * r
        return Question(f"{a} ÷ {b} = ?", _int_choices(r), str(r), 1, sub)
    # sub 5: mixto con jerarquia, 3-4 operandos
    a, b, c = random.randint(2, 9), random.randint(2, 9), random.randint(1, 20)
    r = a + b * c if random.random() < 0.5 else (a * b + c)
    prompt = f"{a} + {b} x {c} = ?" if r == a + b * c else f"{a} x {b} + {c} = ?"
    return Question(prompt, _int_choices(r, radio=10), str(r), 1, sub)


# ---------------- Nivel 2: fracciones ----------------

def _fmt_fr(f: Fraction) -> str:
    if f.denominator == 1:
        return str(f.numerator)
    return f"{f.numerator}/{f.denominator}"


def gen_n2(sub: int) -> Question:
    if sub == 1:  # identifica / simplifica basico
        d = random.choice([2, 4, 8, 3, 6, 9])
        n = random.randint(1, d - 1)
        f = Fraction(n, d)
        prompt = f"Simplifica {n}/{d} = ?"
        distract = [
            _fmt_fr(Fraction(n + 1, d)),
            _fmt_fr(Fraction(n, d + 1)),
            _fmt_fr(Fraction(max(1, n - 1), d)),
            _fmt_fr(Fraction(n + 2, d)),
        ]
        return Question(prompt, _make_choices(_fmt_fr(f), distract), _fmt_fr(f), 2, sub)
    if sub == 2:  # mismo denominador
        d = random.randint(2, 9)
        a, b = random.randint(1, d - 1), random.randint(1, d - 1)
        op = random.choice(["+", "-"])
        r = Fraction(a, d) + Fraction(b, d) if op == "+" else abs(Fraction(a, d) - Fraction(b, d))
        # evita negativos en sub 2
        if op == "-" and b > a:
            a, b = b, a
            r = Fraction(a, d) - Fraction(b, d)
        prompt = f"{a}/{d} {op} {b}/{d} = ?"
        distract = [_fmt_fr(Fraction(a + b, d + 1)), f"{a+b}/{d}", _fmt_fr(r + Fraction(1, d))]
        return Question(prompt, _make_choices(_fmt_fr(r), distract), _fmt_fr(r), 2, sub)
    if sub == 3:  # distinto denominador + simplifica
        d1, d2 = random.randint(2, 9), random.randint(2, 9)
        a, b = random.randint(1, d1), random.randint(1, d2)
        op = random.choice(["+", "-"])
        r = Fraction(a, d1) + Fraction(b, d1 if False else d2) if op == "+" else Fraction(a, d1) - Fraction(b, d2)
        if r < 0:  # reintentamos para no complicar de mas
            a, b = b, a
            d1, d2 = d2, d1
            r = Fraction(a, d1) - Fraction(b, d2)
            if r < 0:
                return gen_n2(3)
        prompt = f"{a}/{d1} {op} {b}/{d2} = ?"
        distract = [f"{a+b}/{d1+d2}", _fmt_fr(r + Fraction(1, d1)), _fmt_fr(abs(r - 1))]
        return Question(prompt, _make_choices(_fmt_fr(r), distract), _fmt_fr(r), 2, sub)
    if sub == 4:  # mult / div
        a, b = random.randint(1, 8), random.randint(1, 8)
        d1, d2 = random.randint(2, 9), random.randint(2, 9)
        if random.random() < 0.5:
            r = Fraction(a, d1) * Fraction(b, d2)
            prompt = f"{a}/{d1} x {b}/{d2} = ?"
        else:
            r = Fraction(a, d1) / Fraction(b, d2)
            prompt = f"{a}/{d1} ÷ {b}/{d2} = ?"
        distract = [
            _fmt_fr(r + 2),
            _fmt_fr(abs(r - 2)) if abs(r - 2) != r else _fmt_fr(r + 3),
            _fmt_fr(r + Fraction(1, 2)) if (r + Fraction(1, 2)) != r else _fmt_fr(r + 1),
            f"{a*b+1}/{d1*d2}",
        ]
        return Question(prompt, _make_choices(_fmt_fr(r), distract), _fmt_fr(r), 2, sub)
    # sub 5: combinada 3 fracciones
    d = random.choice([2, 3, 4, 6])
    a, b, c = (random.randint(1, d) for _ in range(3))
    r = Fraction(a, d) + Fraction(b, d) - Fraction(c, d)
    if r <= 0:
        return gen_n2(5)
    prompt = f"{a}/{d} + {b}/{d} - {c}/{d} = ?"
    distract = [_fmt_fr(r + Fraction(1, d)), f"{a+b+c}/{d}", _fmt_fr(abs(r - 1))]
    return Question(prompt, _make_choices(_fmt_fr(r), distract), _fmt_fr(r), 2, sub)


# ---------------- Nivel 3: signos / enteros ----------------

def gen_n3(sub: int) -> Question:
    if sub == 1:  # producto de signos
        a, b = random.randint(2, 9), random.randint(2, 9)
        s1, s2 = random.choice([-1, 1]), random.choice([-1, 1])
        r = s1 * a * s2 * b
        prompt = f"({s1*a}) x ({s2*b}) = ?"
        distract = [str(-r), str(abs(r) + 1), str(abs(r) - 1)]
        return Question(prompt, _make_choices(str(r), distract), str(r), 3, sub)
    if sub == 2:  # suma/resta enteros -20..20
        a, b = random.randint(-20, 20), random.randint(-20, 20)
        op = random.choice(["+", "-"])
        r = a + b if op == "+" else a - b
        prompt = f"({a}) {op} ({b}) = ?"
        return Question(prompt, _int_choices(r, radio=6), str(r), 3, sub)
    if sub == 3:  # 3 operandos con signos
        a, b, c = (random.randint(-9, 9) for _ in range(3))
        r = a * b + c
        prompt = f"({a}) x ({b}) + ({c}) = ?"
        return Question(prompt, _int_choices(r, radio=10), str(r), 3, sub)
    if sub == 4:  # potencias y raiz exacta
        if random.random() < 0.6:
            base = random.randint(-5, 5)
            exp = random.choice([2, 3])
            r = base**exp
            prompt = f"({base})^{exp} = ?"
            distract = [str(-r), str(abs(r)), str(r + 1)]
            return Question(prompt, _make_choices(str(r), distract), str(r), 3, sub)
        r = random.randint(2, 12)
        prompt = f"√{r*r} = ?"
        return Question(prompt, _int_choices(r), str(r), 3, sub)
    # sub 5: parentesis
    a, b = random.randint(-9, 9), random.randint(-9, 9)
    r = -(a + b)
    prompt = f"-({a} + {b}) = ?" if a >= 0 and b >= 0 else f"-(({a}) + ({b})) = ?"
    return Question(prompt, _int_choices(r, radio=6), str(r), 3, sub)


# ---------------- Nivel 4: algebra ----------------

def gen_n4(sub: int) -> Question:
    if sub == 1:  # x + a = b
        a = random.randint(1, 20)
        x = random.randint(1, 20)
        b = a + x
        prompt = f"x + {a} = {b}.  x = ?"
        return Question(prompt, _int_choices(x), str(x), 4, sub)
    if sub == 2:  # ax + b = c
        a = random.randint(2, 9)
        x = random.randint(1, 12)
        b = random.randint(1, 20)
        c = a * x + b
        prompt = f"{a}x + {b} = {c}.  x = ?"
        return Question(prompt, _int_choices(x), str(x), 4, sub)
    if sub == 3:  # ax - b = c
        a = random.randint(2, 9)
        x = random.randint(1, 12)
        b = random.randint(1, 20)
        c = a * x - b
        prompt = f"{a}x - {b} = {c}.  x = ?"
        return Question(prompt, _int_choices(x), str(x), 4, sub)
    if sub == 4:  # evalua expresion
        x = random.randint(-5, 5)
        a, b = random.randint(1, 6), random.randint(-9, 9)
        r = a * x + b
        prompt = f"Si x = {x},  {a}x + ({b}) = ?"
        return Question(prompt, _int_choices(r, radio=8), str(r), 4, sub)
    # sub 5: cuadratica factorizable x^2 - Sx + P = 0
    r1, r2 = random.randint(1, 9), random.randint(1, 9)
    s, p = r1 + r2, r1 * r2
    prompt = f"x² - {s}x + {p} = 0.  x = ? (una solucion)"
    # aceptamos r1 como correcta, r2 como distractor cercano
    distract = [str(r2), str(s), str(p)]
    # si raices iguales, ajusta
    if r1 == r2:
        distract = [str(r1 + 1), str(r1 - 1), str(s)]
    return Question(prompt, _make_choices(str(r1), distract), str(r1), 4, sub)


# ---------------- Nivel 5: trigonometria ----------------

_NOTABLES = [
    ("sin(30°)", "1/2"),
    ("cos(60°)", "1/2"),
    ("sin(0°)", "0"),
    ("cos(0°)", "1"),
    ("tan(45°)", "1"),
    ("sin(45°)", "√2/2"),
    ("cos(45°)", "√2/2"),
    ("sin(60°)", "√3/2"),
    ("cos(30°)", "√3/2"),
    ("tan(30°)", "√3/3"),
]


def gen_n5(sub: int) -> Question:
    if sub <= 2:
        q, ans = random.choice(_NOTABLES)
        distract = [d for _, d in _NOTABLES if d != ans]
        random.shuffle(distract)
        return Question(f"{q} = ?", _make_choices(ans, distract[:6]), ans, 5, sub)
    if sub == 3:  # pitagoras
        triples = [(3, 4, 5), (6, 8, 10), (5, 12, 13)]
        a, b, c = random.choice(triples)
        if random.random() < 0.5:
            prompt = f"Catetos {a} y {b}. Hipotenusa = ?"
            return Question(prompt, _int_choices(c), str(c), 5, sub)
        prompt = f"Hipotenusa {c}, cateto {a}. Otro cateto = ?"
        return Question(prompt, _int_choices(b), str(b), 5, sub)
    if sub == 4:  # grados-radianes
        pairs = [("180°", "π"), ("90°", "π/2"), ("60°", "π/3"), ("45°", "π/4"), ("30°", "π/6")]
        g, r = random.choice(pairs)
        if random.random() < 0.5:
            distract = [p[1] for p in pairs if p[1] != r]
            return Question(f"{g} en radianes = ?", _make_choices(r, distract), r, 5, sub)
        distract = [p[0] for p in pairs if p[0] != g]
        return Question(f"{r} rad en grados = ?", _make_choices(g, distract), g, 5, sub)
    # sub 5: identidad
    if random.random() < 0.5:
        prompt = "Si sin²θ + cos²θ = ?"
        return Question(prompt, _make_choices("1", ["0", "2", "θ"]), "1", 5, sub)
    a = random.choice([3, 6, 9])
    r = round(math.sqrt(a**2 + 4**2), 2)
    # usa 3-4-5 escalado para resultado entero simple
    prompt = "Halla el valor de x si es hipotenusa de 6 y 8"
    return Question(prompt, _int_choices(10), "10", 5, sub)


_GENERATORS = {0: gen_n0, 1: gen_n1, 2: gen_n2, 3: gen_n3, 4: gen_n4, 5: gen_n5}

# Velocidad fantasma y tiempo sugerido por subnivel (para integrar al juego)
DIFICULTAD = {
    1: {"fantasma": 0.60, "tiempo": 30},
    2: {"fantasma": 0.70, "tiempo": 20},
    3: {"fantasma": 0.80, "tiempo": 15},
    4: {"fantasma": 0.90, "tiempo": 12},
    5: {"fantasma": 1.00, "tiempo": 10},
}


def generate(nivel: int, subnivel: int) -> Question:
    if nivel not in _GENERATORS:
        raise ValueError(f"Nivel {nivel} no existe (0-5)")
    subnivel = max(1, min(5, subnivel))
    return _GENERATORS[nivel](subnivel)
