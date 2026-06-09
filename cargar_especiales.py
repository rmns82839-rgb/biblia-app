"""
============================================================
 CARGADOR DE VERSÍCULOS ESPECIALES → NEON
 
 Carga:
 1. Palabras de Jesús (Evangelios + Apocalipsis)
 2. Profecías mesiánicas clásicas (~125 versículos)
 3. Juicios de Jehová cumplidos y por cumplirse

 Uso:
   python cargar_especiales.py --palabras-jesus
   python cargar_especiales.py --profecias
   python cargar_especiales.py --juicios
   python cargar_especiales.py --todo
============================================================
"""

import os, sys
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌  Falta DATABASE_URL en .env")
    sys.exit(1)

# ─── PALABRAS DE JESÚS ───────────────────────────────────────
# Formato: (libro_nombre, capitulo, versiculo_inicio, versiculo_fin, tipo)
# Si inicio == fin es un solo versículo
# Fuente: edición RV1960 con letras rojas (Red Letter Edition)

PALABRAS_JESUS = [
    # ── MATEO ──────────────────────────────────────────────
    ('Mateo', 3, 15, 15, 'directo'),
    ('Mateo', 4, 4, 4, 'directo'),
    ('Mateo', 4, 7, 7, 'directo'),
    ('Mateo', 4, 10, 10, 'directo'),
    ('Mateo', 4, 17, 17, 'directo'),
    ('Mateo', 5, 2, 12, 'directo'),   # Bienaventuranzas
    ('Mateo', 5, 17, 48, 'directo'),
    ('Mateo', 6, 1, 34, 'directo'),   # Oración del Señor
    ('Mateo', 7, 1, 27, 'directo'),
    ('Mateo', 8, 7, 7, 'directo'),
    ('Mateo', 8, 10, 13, 'directo'),
    ('Mateo', 8, 20, 20, 'directo'),
    ('Mateo', 8, 22, 22, 'directo'),
    ('Mateo', 8, 26, 26, 'directo'),
    ('Mateo', 8, 32, 32, 'directo'),
    ('Mateo', 9, 2, 2, 'directo'),
    ('Mateo', 9, 4, 8, 'directo'),
    ('Mateo', 9, 12, 13, 'directo'),
    ('Mateo', 9, 15, 17, 'directo'),
    ('Mateo', 9, 22, 22, 'directo'),
    ('Mateo', 9, 24, 24, 'directo'),
    ('Mateo', 9, 28, 30, 'directo'),
    ('Mateo', 9, 37, 38, 'directo'),
    ('Mateo', 10, 5, 42, 'directo'),
    ('Mateo', 11, 4, 30, 'directo'),
    ('Mateo', 12, 3, 8, 'directo'),
    ('Mateo', 12, 11, 12, 'directo'),
    ('Mateo', 12, 25, 45, 'directo'),
    ('Mateo', 12, 48, 50, 'directo'),
    ('Mateo', 13, 3, 52, 'parábola'),
    ('Mateo', 15, 3, 11, 'directo'),
    ('Mateo', 15, 13, 14, 'directo'),
    ('Mateo', 15, 24, 28, 'directo'),
    ('Mateo', 16, 2, 4, 'directo'),
    ('Mateo', 16, 6, 6, 'directo'),
    ('Mateo', 16, 8, 12, 'directo'),
    ('Mateo', 16, 15, 19, 'directo'),
    ('Mateo', 16, 23, 28, 'directo'),
    ('Mateo', 17, 7, 12, 'directo'),
    ('Mateo', 17, 17, 21, 'directo'),
    ('Mateo', 17, 22, 23, 'directo'),
    ('Mateo', 17, 25, 27, 'directo'),
    ('Mateo', 18, 2, 35, 'directo'),
    ('Mateo', 19, 4, 12, 'directo'),
    ('Mateo', 19, 14, 15, 'directo'),
    ('Mateo', 19, 17, 26, 'directo'),
    ('Mateo', 19, 28, 30, 'directo'),
    ('Mateo', 20, 1, 16, 'parábola'),
    ('Mateo', 20, 18, 19, 'directo'),
    ('Mateo', 20, 21, 28, 'directo'),
    ('Mateo', 21, 2, 3, 'directo'),
    ('Mateo', 21, 13, 13, 'directo'),
    ('Mateo', 21, 16, 16, 'directo'),
    ('Mateo', 21, 21, 22, 'directo'),
    ('Mateo', 21, 24, 27, 'directo'),
    ('Mateo', 21, 28, 44, 'parábola'),
    ('Mateo', 22, 1, 14, 'parábola'),
    ('Mateo', 22, 18, 22, 'directo'),
    ('Mateo', 22, 29, 32, 'directo'),
    ('Mateo', 22, 37, 40, 'directo'),
    ('Mateo', 22, 42, 45, 'directo'),
    ('Mateo', 23, 1, 39, 'directo'),  # Ayes contra los fariseos
    ('Mateo', 24, 2, 51, 'directo'),  # Discurso del Monte de los Olivos
    ('Mateo', 25, 1, 46, 'parábola'),
    ('Mateo', 26, 2, 2, 'directo'),
    ('Mateo', 26, 10, 13, 'directo'),
    ('Mateo', 26, 18, 18, 'directo'),
    ('Mateo', 26, 21, 29, 'directo'),
    ('Mateo', 26, 31, 32, 'directo'),
    ('Mateo', 26, 34, 34, 'directo'),
    ('Mateo', 26, 36, 36, 'directo'),
    ('Mateo', 26, 38, 46, 'oración'),
    ('Mateo', 26, 50, 50, 'directo'),
    ('Mateo', 26, 52, 56, 'directo'),
    ('Mateo', 26, 64, 64, 'directo'),
    ('Mateo', 27, 11, 11, 'directo'),
    ('Mateo', 27, 46, 46, 'directo'),  # Elí, Elí...
    ('Mateo', 28, 9, 10, 'resucitado'),
    ('Mateo', 28, 18, 20, 'resucitado'),  # Gran Comisión

    # ── MARCOS ─────────────────────────────────────────────
    ('Marcos', 1, 15, 15, 'directo'),
    ('Marcos', 1, 17, 17, 'directo'),
    ('Marcos', 1, 25, 25, 'directo'),
    ('Marcos', 1, 38, 38, 'directo'),
    ('Marcos', 1, 41, 44, 'directo'),
    ('Marcos', 2, 5, 11, 'directo'),
    ('Marcos', 2, 14, 14, 'directo'),
    ('Marcos', 2, 17, 22, 'directo'),
    ('Marcos', 2, 25, 28, 'directo'),
    ('Marcos', 3, 3, 5, 'directo'),
    ('Marcos', 3, 23, 29, 'directo'),
    ('Marcos', 3, 33, 35, 'directo'),
    ('Marcos', 4, 3, 32, 'parábola'),
    ('Marcos', 4, 39, 40, 'directo'),
    ('Marcos', 5, 8, 9, 'directo'),
    ('Marcos', 5, 34, 34, 'directo'),
    ('Marcos', 5, 36, 36, 'directo'),
    ('Marcos', 5, 39, 39, 'directo'),
    ('Marcos', 5, 41, 41, 'directo'),
    ('Marcos', 6, 4, 4, 'directo'),
    ('Marcos', 6, 10, 11, 'directo'),
    ('Marcos', 6, 31, 31, 'directo'),
    ('Marcos', 6, 50, 50, 'directo'),
    ('Marcos', 7, 6, 23, 'directo'),
    ('Marcos', 7, 27, 29, 'directo'),
    ('Marcos', 8, 5, 6, 'directo'),
    ('Marcos', 8, 12, 12, 'directo'),
    ('Marcos', 8, 15, 21, 'directo'),
    ('Marcos', 8, 23, 23, 'directo'),
    ('Marcos', 8, 27, 33, 'directo'),
    ('Marcos', 8, 34, 38, 'directo'),
    ('Marcos', 9, 1, 1, 'directo'),
    ('Marcos', 9, 12, 13, 'directo'),
    ('Marcos', 9, 16, 19, 'directo'),
    ('Marcos', 9, 21, 25, 'directo'),
    ('Marcos', 9, 29, 29, 'directo'),
    ('Marcos', 9, 31, 31, 'directo'),
    ('Marcos', 9, 33, 50, 'directo'),
    ('Marcos', 10, 3, 12, 'directo'),
    ('Marcos', 10, 14, 15, 'directo'),
    ('Marcos', 10, 18, 27, 'directo'),
    ('Marcos', 10, 29, 31, 'directo'),
    ('Marcos', 10, 33, 34, 'directo'),
    ('Marcos', 10, 36, 40, 'directo'),
    ('Marcos', 10, 42, 45, 'directo'),
    ('Marcos', 10, 49, 52, 'directo'),
    ('Marcos', 11, 2, 3, 'directo'),
    ('Marcos', 11, 14, 14, 'directo'),
    ('Marcos', 11, 17, 17, 'directo'),
    ('Marcos', 11, 22, 26, 'directo'),
    ('Marcos', 11, 29, 33, 'directo'),
    ('Marcos', 12, 1, 11, 'parábola'),
    ('Marcos', 12, 15, 17, 'directo'),
    ('Marcos', 12, 24, 27, 'directo'),
    ('Marcos', 12, 29, 31, 'directo'),
    ('Marcos', 12, 35, 40, 'directo'),
    ('Marcos', 12, 43, 44, 'directo'),
    ('Marcos', 13, 2, 37, 'directo'),
    ('Marcos', 14, 6, 9, 'directo'),
    ('Marcos', 14, 13, 15, 'directo'),
    ('Marcos', 14, 18, 25, 'directo'),
    ('Marcos', 14, 27, 28, 'directo'),
    ('Marcos', 14, 30, 30, 'directo'),
    ('Marcos', 14, 32, 32, 'directo'),
    ('Marcos', 14, 34, 42, 'oración'),
    ('Marcos', 14, 48, 49, 'directo'),
    ('Marcos', 14, 62, 62, 'directo'),
    ('Marcos', 15, 2, 2, 'directo'),
    ('Marcos', 15, 34, 34, 'directo'),
    ('Marcos', 16, 6, 7, 'resucitado'),
    ('Marcos', 16, 15, 18, 'resucitado'),

    # ── LUCAS ──────────────────────────────────────────────
    ('Lucas', 2, 49, 49, 'directo'),
    ('Lucas', 3, 16, 16, 'directo'),  # Juan el Bautista cita a Jesús
    ('Lucas', 4, 4, 4, 'directo'),
    ('Lucas', 4, 8, 8, 'directo'),
    ('Lucas', 4, 12, 12, 'directo'),
    ('Lucas', 4, 18, 19, 'directo'),
    ('Lucas', 4, 21, 21, 'directo'),
    ('Lucas', 4, 23, 27, 'directo'),
    ('Lucas', 4, 35, 35, 'directo'),
    ('Lucas', 4, 43, 43, 'directo'),
    ('Lucas', 5, 4, 4, 'directo'),
    ('Lucas', 5, 10, 10, 'directo'),
    ('Lucas', 5, 13, 14, 'directo'),
    ('Lucas', 5, 20, 24, 'directo'),
    ('Lucas', 5, 27, 27, 'directo'),
    ('Lucas', 5, 31, 39, 'directo'),
    ('Lucas', 6, 3, 5, 'directo'),
    ('Lucas', 6, 8, 10, 'directo'),
    ('Lucas', 6, 20, 49, 'directo'),  # Sermón del llano
    ('Lucas', 7, 9, 10, 'directo'),
    ('Lucas', 7, 13, 14, 'directo'),
    ('Lucas', 7, 22, 23, 'directo'),
    ('Lucas', 7, 24, 35, 'directo'),
    ('Lucas', 7, 40, 48, 'directo'),
    ('Lucas', 7, 50, 50, 'directo'),
    ('Lucas', 8, 10, 18, 'parábola'),
    ('Lucas', 8, 21, 21, 'directo'),
    ('Lucas', 8, 22, 25, 'directo'),
    ('Lucas', 8, 28, 30, 'directo'),
    ('Lucas', 8, 39, 39, 'directo'),
    ('Lucas', 8, 45, 48, 'directo'),
    ('Lucas', 8, 50, 54, 'directo'),
    ('Lucas', 9, 3, 5, 'directo'),
    ('Lucas', 9, 13, 14, 'directo'),
    ('Lucas', 9, 18, 27, 'directo'),
    ('Lucas', 9, 35, 35, 'directo'),  # Voz del Padre sobre Jesús
    ('Lucas', 9, 41, 41, 'directo'),
    ('Lucas', 9, 44, 44, 'directo'),
    ('Lucas', 9, 48, 50, 'directo'),
    ('Lucas', 9, 55, 62, 'directo'),
    ('Lucas', 10, 2, 24, 'directo'),
    ('Lucas', 10, 26, 28, 'directo'),
    ('Lucas', 10, 30, 37, 'parábola'),  # Buen Samaritano
    ('Lucas', 10, 41, 42, 'directo'),
    ('Lucas', 11, 2, 13, 'directo'),    # Padrenuestro versión Lucas
    ('Lucas', 11, 17, 52, 'directo'),
    ('Lucas', 12, 1, 59, 'directo'),
    ('Lucas', 13, 2, 9, 'directo'),
    ('Lucas', 13, 12, 17, 'directo'),
    ('Lucas', 13, 18, 21, 'parábola'),
    ('Lucas', 13, 23, 35, 'directo'),
    ('Lucas', 14, 3, 24, 'directo'),
    ('Lucas', 15, 3, 32, 'parábola'),   # Hijo pródigo
    ('Lucas', 16, 1, 31, 'parábola'),
    ('Lucas', 17, 1, 10, 'directo'),
    ('Lucas', 17, 14, 14, 'directo'),
    ('Lucas', 17, 17, 21, 'directo'),
    ('Lucas', 17, 22, 37, 'directo'),
    ('Lucas', 18, 1, 17, 'parábola'),
    ('Lucas', 18, 19, 30, 'directo'),
    ('Lucas', 18, 31, 34, 'directo'),
    ('Lucas', 18, 40, 42, 'directo'),
    ('Lucas', 19, 5, 10, 'directo'),
    ('Lucas', 19, 12, 27, 'parábola'),  # Las minas
    ('Lucas', 19, 30, 31, 'directo'),
    ('Lucas', 19, 40, 40, 'directo'),
    ('Lucas', 19, 43, 44, 'directo'),
    ('Lucas', 19, 46, 46, 'directo'),
    ('Lucas', 20, 3, 18, 'directo'),
    ('Lucas', 20, 23, 25, 'directo'),
    ('Lucas', 20, 34, 38, 'directo'),
    ('Lucas', 20, 41, 47, 'directo'),
    ('Lucas', 21, 3, 36, 'directo'),
    ('Lucas', 22, 8, 12, 'directo'),
    ('Lucas', 22, 15, 22, 'directo'),
    ('Lucas', 22, 25, 38, 'directo'),
    ('Lucas', 22, 40, 46, 'oración'),
    ('Lucas', 22, 48, 48, 'directo'),
    ('Lucas', 22, 51, 51, 'directo'),
    ('Lucas', 22, 67, 70, 'directo'),
    ('Lucas', 23, 3, 3, 'directo'),
    ('Lucas', 23, 28, 31, 'directo'),
    ('Lucas', 23, 34, 34, 'directo'),   # Padre, perdónalos
    ('Lucas', 23, 43, 43, 'directo'),   # Hoy estarás conmigo en el paraíso
    ('Lucas', 23, 46, 46, 'directo'),   # En tus manos encomiendo mi espíritu
    ('Lucas', 24, 17, 19, 'resucitado'),
    ('Lucas', 24, 25, 27, 'resucitado'),
    ('Lucas', 24, 36, 36, 'resucitado'),
    ('Lucas', 24, 38, 49, 'resucitado'),

    # ── JUAN ───────────────────────────────────────────────
    ('Juan', 1, 38, 39, 'directo'),
    ('Juan', 1, 42, 42, 'directo'),
    ('Juan', 1, 43, 43, 'directo'),
    ('Juan', 1, 47, 51, 'directo'),
    ('Juan', 2, 4, 4, 'directo'),
    ('Juan', 2, 7, 8, 'directo'),
    ('Juan', 2, 16, 16, 'directo'),
    ('Juan', 2, 19, 19, 'directo'),
    ('Juan', 3, 3, 21, 'directo'),      # Nicodemo - Jn 3:16
    ('Juan', 3, 27, 36, 'directo'),
    ('Juan', 4, 7, 26, 'directo'),      # Mujer samaritana
    ('Juan', 4, 32, 38, 'directo'),
    ('Juan', 4, 48, 50, 'directo'),
    ('Juan', 5, 6, 47, 'directo'),
    ('Juan', 6, 5, 65, 'directo'),      # Pan de vida
    ('Juan', 6, 67, 70, 'directo'),
    ('Juan', 7, 6, 8, 'directo'),
    ('Juan', 7, 16, 24, 'directo'),
    ('Juan', 7, 28, 29, 'directo'),
    ('Juan', 7, 33, 34, 'directo'),
    ('Juan', 7, 37, 38, 'directo'),
    ('Juan', 8, 7, 11, 'directo'),
    ('Juan', 8, 12, 58, 'directo'),     # Yo soy la luz del mundo
    ('Juan', 9, 3, 5, 'directo'),
    ('Juan', 9, 35, 41, 'directo'),
    ('Juan', 10, 1, 30, 'directo'),     # Yo soy el buen pastor
    ('Juan', 10, 32, 38, 'directo'),
    ('Juan', 11, 4, 4, 'directo'),
    ('Juan', 11, 9, 10, 'directo'),
    ('Juan', 11, 14, 15, 'directo'),
    ('Juan', 11, 23, 27, 'directo'),
    ('Juan', 11, 25, 26, 'directo'),    # Yo soy la resurrección y la vida
    ('Juan', 11, 34, 34, 'directo'),
    ('Juan', 11, 39, 40, 'directo'),
    ('Juan', 11, 41, 43, 'directo'),
    ('Juan', 12, 7, 8, 'directo'),
    ('Juan', 12, 23, 32, 'directo'),
    ('Juan', 12, 35, 36, 'directo'),
    ('Juan', 12, 44, 50, 'directo'),
    ('Juan', 13, 7, 17, 'directo'),     # Lavamiento de pies
    ('Juan', 13, 19, 20, 'directo'),
    ('Juan', 13, 21, 21, 'directo'),
    ('Juan', 13, 23, 26, 'directo'),
    ('Juan', 13, 27, 28, 'directo'),
    ('Juan', 13, 31, 38, 'directo'),
    ('Juan', 14, 1, 31, 'directo'),     # Yo soy el camino, la verdad y la vida
    ('Juan', 15, 1, 27, 'directo'),     # Yo soy la vid verdadera
    ('Juan', 16, 1, 33, 'directo'),
    ('Juan', 17, 1, 26, 'oración'),     # Oración sacerdotal
    ('Juan', 18, 4, 8, 'directo'),
    ('Juan', 18, 11, 11, 'directo'),
    ('Juan', 18, 20, 23, 'directo'),
    ('Juan', 18, 34, 37, 'directo'),
    ('Juan', 19, 11, 11, 'directo'),
    ('Juan', 19, 26, 28, 'directo'),    # Mujer, he ahí tu hijo
    ('Juan', 19, 30, 30, 'directo'),    # Consumado es
    ('Juan', 20, 13, 17, 'resucitado'),
    ('Juan', 20, 19, 23, 'resucitado'),
    ('Juan', 20, 26, 29, 'resucitado'),
    ('Juan', 21, 5, 6, 'resucitado'),
    ('Juan', 21, 10, 17, 'resucitado'), # Apacienta mis ovejas
    ('Juan', 21, 19, 22, 'resucitado'),

    # ── APOCALIPSIS ────────────────────────────────────────
    ('Apocalipsis', 1, 8, 8, 'resucitado'),
    ('Apocalipsis', 1, 11, 11, 'resucitado'),
    ('Apocalipsis', 1, 17, 20, 'resucitado'),
    ('Apocalipsis', 2, 1, 29, 'resucitado'),   # Cartas a las 7 iglesias
    ('Apocalipsis', 3, 1, 22, 'resucitado'),
    ('Apocalipsis', 16, 15, 15, 'resucitado'),
    ('Apocalipsis', 21, 5, 8, 'resucitado'),
    ('Apocalipsis', 22, 7, 7, 'resucitado'),
    ('Apocalipsis', 22, 12, 13, 'resucitado'),
    ('Apocalipsis', 22, 16, 16, 'resucitado'),
    ('Apocalipsis', 22, 20, 20, 'resucitado'),
]

# ─── PROFECÍAS MESIÁNICAS CLÁSICAS ──────────────────────────
# Formato: (libro, cap, vers, tema, cumplimiento_libro, cum_cap, cum_vers)
PROFECIAS_MESIANICAS = [
    ('Génesis',      3, 15, 'Simiente de la mujer aplastará a la serpiente',     'Gálatas', 4, 4),
    ('Génesis',     12,  3, 'En Abraham serán benditas todas las naciones',       'Gálatas', 3, 8),
    ('Génesis',     22, 18, 'En tu simiente serán benditas las naciones',         'Gálatas', 3, 16),
    ('Génesis',     49, 10, 'El cetro no se apartará de Judá',                   'Lucas',   3, 33),
    ('Números',     24, 17, 'Estrella de Jacob / cetro de Israel',               'Mateo',   2, 2),
    ('Deuteronomio',18, 15, 'Profeta como Moisés levantaré',                     'Juan',    6, 14),
    ('Salmos',       2,  7, 'Mi hijo eres tú, yo te engendré hoy',               'Lucas',   3, 22),
    ('Salmos',       8,  2, 'De la boca de los niños perfeccionaste la alabanza', 'Mateo',  21, 16),
    ('Salmos',      16, 10, 'No dejarás mi alma en el Seol',                     'Hechos',  2, 31),
    ('Salmos',      22,  1, 'Dios mío, por qué me has desamparado',              'Mateo',  27, 46),
    ('Salmos',      22,  7, 'Se burlaron de mí, menearon la cabeza',             'Mateo',  27, 39),
    ('Salmos',      22, 16, 'Horadaron mis manos y mis pies',                    'Juan',   20, 25),
    ('Salmos',      22, 18, 'Repartieron entre sí mis vestidos',                 'Juan',   19, 24),
    ('Salmos',      34, 20, 'Guarda todos sus huesos, ninguno será quebrado',    'Juan',   19, 36),
    ('Salmos',      41,  9, 'Mi amigo levantó contra mí su calcañar',            'Juan',   13, 18),
    ('Salmos',      45,  6, 'Tu trono, oh Dios, es eterno',                      'Hebreos', 1, 8),
    ('Salmos',      69,  9, 'El celo de tu casa me consume',                     'Juan',    2, 17),
    ('Salmos',      69, 21, 'Me dieron a beber vinagre',                         'Mateo',  27, 34),
    ('Salmos',      72, 10, 'Los reyes de Tarsis traerán presentes',             'Mateo',   2, 11),
    ('Salmos',      78,  2, 'Abriré mi boca en parábolas',                       'Mateo',  13, 35),
    ('Salmos',      89,  3, 'Hice alianza con mi escogido',                      'Lucas',   1, 32),
    ('Salmos',     110,  1, 'Siéntate a mi diestra',                             'Mateo',  22, 44),
    ('Salmos',     110,  4, 'Sacerdote para siempre según Melquisedec',          'Hebreos', 5, 6),
    ('Salmos',     118, 22, 'La piedra que desecharon los edificadores',         'Mateo',  21, 42),
    ('Salmos',     118, 26, 'Bendito el que viene en nombre de Jehová',          'Mateo',  21, 9),
    ('Isaías',       7, 14, 'La virgen concebirá y dará a luz un hijo: Emanuel', 'Mateo',   1, 23),
    ('Isaías',       9,  1, 'El pueblo que andaba en tinieblas vio gran luz',    'Mateo',   4, 16),
    ('Isaías',       9,  6, 'Un niño nos es nacido, Príncipe de paz',            'Lucas',   2, 11),
    ('Isaías',      11,  1, 'Saldrá una vara del tronco de Isaí',               'Romanos', 15, 12),
    ('Isaías',      11,  2, 'Reposará sobre él el Espíritu de Jehová',           'Mateo',   3, 16),
    ('Isaías',      25,  8, 'Destruirá a la muerte para siempre',                '1 Corintios', 15, 54),
    ('Isaías',      28, 16, 'He aquí que yo he puesto en Sion por fundamento una piedra', 'Romanos', 9, 33),
    ('Isaías',      35,  5, 'Los ojos de los ciegos serán abiertos',             'Mateo',  11, 5),
    ('Isaías',      40,  3, 'Voz que clama en el desierto',                      'Mateo',   3, 3),
    ('Isaías',      42,  1, 'Mi siervo, mi escogido, en quien mi alma tiene contentamiento', 'Mateo', 12, 18),
    ('Isaías',      42,  2, 'No gritará ni alzará su voz',                       'Mateo',  12, 19),
    ('Isaías',      49,  6, 'Te di por luz a las naciones',                      'Lucas',   2, 32),
    ('Isaías',      50,  6, 'Di mi cuerpo a los heridores',                      'Mateo',  26, 67),
    ('Isaías',      53,  1, '¿Quién ha creído a nuestro anuncio?',              'Juan',   12, 38),
    ('Isaías',      53,  3, 'Varón de dolores, experimentado en quebranto',      'Juan',    1, 11),
    ('Isaías',      53,  4, 'Ciertamente llevó él nuestras enfermedades',        'Mateo',   8, 17),
    ('Isaías',      53,  5, 'Herido fue por nuestras rebeliones',                'Romanos', 4, 25),
    ('Isaías',      53,  7, 'Como cordero fue llevado al matadero',              'Juan',    1, 29),
    ('Isaías',      53,  9, 'Con los ricos fue en su muerte',                    'Mateo',  27, 57),
    ('Isaías',      53, 12, 'Con los transgresores fue contado',                 'Lucas',  22, 37),
    ('Isaías',      55,  3, 'Las misericordias firmes a David',                  'Hechos', 13, 34),
    ('Isaías',      60,  3, 'Las naciones vendrán a tu luz',                     'Mateo',   2, 1),
    ('Isaías',      61,  1, 'El Espíritu de Jehová está sobre mí',               'Lucas',   4, 18),
    ('Jeremías',    31, 15, 'Voz fue oída en Ramá, llanto y lloro amargo',      'Mateo',   2, 18),
    ('Jeremías',    31, 31, 'He aquí que vienen días en que haré nuevo pacto',   'Hebreos', 8, 8),
    ('Miqueas',      5,  2, 'Belén Efrata, de ti saldrá el que será Señor',     'Mateo',   2, 6),
    ('Zacarías',     9,  9, 'Tu rey vendrá humilde, montado sobre un asno',     'Mateo',  21, 5),
    ('Zacarías',    11, 12, 'Pesaron por mi salario treinta piezas de plata',   'Mateo',  26, 15),
    ('Zacarías',    11, 13, 'Echaron las treinta piezas de plata al alfarero',  'Mateo',  27, 9),
    ('Zacarías',    12, 10, 'Mirarán a mí, a quien traspasaron',                'Juan',   19, 37),
    ('Malaquías',    3,  1, 'He aquí, yo envío mi mensajero',                   'Mateo',  11, 10),
    ('Malaquías',    4,  5, 'He aquí, yo os envío el profeta Elías',            'Mateo',  11, 14),
]

# ─── JUICIOS DE JEHOVÁ ──────────────────────────────────────
# Formato: (libro, cap, vers, estado, sobre, cuando, descripcion)
JUICIOS = [
    # ── CUMPLIDOS ──────────────────────────────────────────
    ('Génesis',   6, 13, 'cumplido', 'Humanidad corrupta',
     '~2350 a.C.', 'El diluvio universal que destruyó la humanidad excepto Noé y su familia'),
    ('Génesis',  18, 20, 'cumplido', 'Sodoma y Gomorra',
     '~2000 a.C.', 'Destrucción de Sodoma y Gomorra por su gran maldad'),
    ('Éxodo',     7,  1, 'cumplido', 'Egipto — Las 10 plagas',
     '~1446 a.C.', 'Diez plagas sobre Egipto por negarse a dejar ir a Israel'),
    ('Levítico', 26, 14, 'cumplido', 'Israel por desobediencia',
     '722 a.C. y 586 a.C.', 'Cautiverio asirio y babilónico por abandonar el pacto'),
    ('Isaías',   13,  1, 'cumplido', 'Babilonia',
     '539 a.C.', 'Caída de Babilonia ante los medos y persas'),
    ('Isaías',   23,  1, 'cumplido', 'Tiro',
     '332 a.C.', 'Destrucción de Tiro por Alejandro Magno'),
    ('Ezequiel', 26,  1, 'cumplido', 'Tiro',
     '332 a.C.', 'Profecía detallada del sitio y destrucción de Tiro'),
    ('Ezequiel', 25,  1, 'cumplido', 'Amón, Moab, Edom, Filistea',
     '586–550 a.C.', 'Juicios contra las naciones vecinas de Israel'),
    ('Miqueas',   3, 12, 'cumplido', 'Jerusalén',
     '586 a.C.', 'Destrucción de Jerusalén y el templo por Nabucodonosor'),
    ('Nahum',     1,  1, 'cumplido', 'Nínive',
     '612 a.C.', 'Destrucción completa de Nínive por los babilonios'),
    ('Sofonías',  1,  1, 'cumplido', 'Judá y Jerusalén',
     '586 a.C.', 'Juicio sobre Judá ejecutado por Babilonia'),
    ('Mateo',    24,  2, 'cumplido', 'Templo de Jerusalén',
     '70 d.C.', 'Destrucción del templo por el general romano Tito'),
    ('Lucas',    21, 20, 'cumplido', 'Jerusalén',
     '70 d.C.', 'Sitio y destrucción de Jerusalén por Roma'),

    # ── POR CUMPLIRSE ───────────────────────────────────────
    ('Daniel',    2, 44, 'por_cumplirse', 'Todos los reinos del mundo',
     'Futuro', 'El reino de Dios que destruirá todos los reinos y permanecerá para siempre'),
    ('Daniel',   12,  1, 'por_cumplirse', 'Tiempo del fin',
     'Futuro', 'Gran tiempo de angustia, resurrección y juicio final'),
    ('Ezequiel', 38,  1, 'por_cumplirse', 'Gog y Magog',
     'Futuro', 'Invasión de Israel por coalición de naciones en los últimos tiempos'),
    ('Zacarías', 12,  1, 'por_cumplirse', 'Naciones contra Jerusalén',
     'Futuro', 'Batalla final contra Jerusalén y liberación divina de Israel'),
    ('Zacarías', 14,  1, 'por_cumplirse', 'Día de Jehová',
     'Futuro', 'El día del Señor cuando Jesús regresa al Monte de los Olivos'),
    ('Malaquías',  4,  1, 'por_cumplirse', 'Impíos',
     'Futuro', 'El día ardiente que destruirá a los soberbios e impíos'),
    ('Apocalipsis', 6,  1, 'por_cumplirse', 'Humanidad — Sellos',
     'Futuro', 'Los siete sellos del juicio durante la gran tribulación'),
    ('Apocalipsis', 8,  1, 'por_cumplirse', 'Tierra — Trompetas',
     'Futuro', 'Las siete trompetas de juicio sobre la tierra'),
    ('Apocalipsis',16,  1, 'por_cumplirse', 'Bestia y sus seguidores — Copas',
     'Futuro', 'Las siete copas de la ira de Dios derramadas sobre la tierra'),
    ('Apocalipsis',17,  1, 'por_cumplirse', 'Babilonia la Grande',
     'Futuro', 'Juicio y destrucción de Babilonia la Grande'),
    ('Apocalipsis',19, 11, 'por_cumplirse', 'Bestia y falso profeta',
     'Futuro', 'Segunda venida de Cristo y destrucción de la bestia y el falso profeta'),
    ('Apocalipsis',20,  7, 'por_cumplirse', 'Gog y Magog — final',
     'Futuro', 'Juicio final de Satanás y sus seguidores después del milenio'),
    ('Apocalipsis',20, 11, 'por_cumplirse', 'Todos los muertos',
     'Futuro', 'El gran trono blanco — juicio final de toda la humanidad'),

    # ── CUMPLIMIENTO PARCIAL ────────────────────────────────
    ('Isaías',   11,  6, 'cumplimiento_parcial', 'Creación restaurada',
     'Parcial — Milenio y eternidad', 'El lobo morará con el cordero — restauración en el milenio y la eternidad'),
    ('Isaías',   65, 17, 'cumplimiento_parcial', 'Nuevos cielos y nueva tierra',
     'Parcial — En proceso', 'Promesa de nueva creación, cumplida plenamente en Apocalipsis 21'),
    ('Joel',      2, 28, 'cumplimiento_parcial', 'Derramamiento del Espíritu',
     'Parcial — Pentecostés y final', 'Iniciado en Pentecostés, plenitud en el retorno de Cristo'),
    ('Amós',      9, 11, 'cumplimiento_parcial', 'Restauración del tabernáculo de David',
     'Parcial — Iglesia y milenio', 'Citado en Hechos 15:16 y cumplimiento pleno en el milenio'),
]

# ─── FUNCIONES DE CARGA ─────────────────────────────────────

def get_versiculo_id(cur, libro_nombre, capitulo, versiculo):
    cur.execute("""
        SELECT v.id FROM versiculos v
        JOIN capitulos c ON v.capitulo_id = c.id
        JOIN libros l    ON v.libro_id = l.id
        WHERE l.nombre = %s AND c.numero = %s AND v.numero = %s
    """, (libro_nombre, capitulo, versiculo))
    row = cur.fetchone()
    return row[0] if row else None

def cargar_palabras_jesus(cur):
    print("\n📖  Cargando palabras de Jesús...")
    ok = 0; err = 0
    rows = []
    for (libro, cap, v_ini, v_fin, tipo) in PALABRAS_JESUS:
        for v_num in range(v_ini, v_fin + 1):
            vid = get_versiculo_id(cur, libro, cap, v_num)
            if vid:
                rows.append((vid, tipo))
                ok += 1
            else:
                err += 1
    if rows:
        execute_values(cur, """
            INSERT INTO palabras_jesus (versiculo_id, tipo)
            VALUES %s ON CONFLICT (versiculo_id) DO NOTHING
        """, rows)
    print(f"  ✅  {ok} versículos insertados | {err} no encontrados")

def cargar_profecias(cur):
    print("\n🌟  Cargando profecías mesiánicas...")
    ok = 0; err = 0
    for (libro, cap, vers, tema, cum_libro, cum_cap, cum_vers) in PROFECIAS_MESIANICAS:
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid:
            print(f"  ⚠️  No encontrado: {libro} {cap}:{vers}")
            err += 1; continue
        cum_id = get_versiculo_id(cur, cum_libro, cum_cap, cum_vers)
        cur.execute("""
            INSERT INTO profecias_mesianicas (versiculo_id, cumplimiento_id, tema)
            VALUES (%s, %s, %s) ON CONFLICT (versiculo_id) DO NOTHING
        """, (vid, cum_id, tema))
        ok += 1
    print(f"  ✅  {ok} profecías insertadas | {err} no encontradas")

def cargar_juicios(cur):
    print("\n⚖️   Cargando juicios de Jehová...")
    ok = 0; err = 0
    for (libro, cap, vers, estado, sobre, cuando, desc) in JUICIOS:
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid:
            print(f"  ⚠️  No encontrado: {libro} {cap}:{vers}")
            err += 1; continue
        cur.execute("""
            INSERT INTO juicios_jehova (versiculo_id, estado, sobre, cuando_cumplido, descripcion)
            VALUES (%s, %s, %s, %s, %s) ON CONFLICT (versiculo_id) DO NOTHING
        """, (vid, estado, sobre, cuando, desc))
        ok += 1
    print(f"  ✅  {ok} juicios insertados | {err} no encontrados")

# ─── MAIN ───────────────────────────────────────────────────
if __name__ == '__main__':
    args = sys.argv[1:]
    todo         = '--todo'           in args
    pal_jesus    = '--palabras-jesus' in args or todo
    profecias    = '--profecias'      in args or todo
    juicios      = '--juicios'        in args or todo

    if not any([pal_jesus, profecias, juicios]):
        print("Uso: python cargar_especiales.py --todo")
        print("     python cargar_especiales.py --palabras-jesus")
        print("     python cargar_especiales.py --profecias")
        print("     python cargar_especiales.py --juicios")
        sys.exit(0)

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    if pal_jesus: cargar_palabras_jesus(cur)
    if profecias: cargar_profecias(cur)
    if juicios:   cargar_juicios(cur)

    conn.commit()
    cur.close(); conn.close()
    print("\n🎉  Listo.")