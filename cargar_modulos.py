"""
============================================================
 CARGADOR DE MÓDULOS BÍBLICOS → NEON
 
 Módulos:
 1. Reyes de Israel y Judá (línea de tiempo)
 2. Ángeles en la Biblia (angelología)
 3. Títulos del Mesías (cristología)
 4. Números bíblicos (numerología)
 
 Fuentes:
 - Texto bíblico RV1960 (ya en DB)
 - Cronología: Edwin Thiele "The Mysterious Numbers of the Hebrew Kings"
 - Reyes: 1-2 Reyes, 1-2 Crónicas
 - Ángeles: concordancia bíblica completa
 - Cristología: referencias directas del texto bíblico
 - Numerología: concordancia y teología bíblica

 Uso: python cargar_modulos.py --todo
      python cargar_modulos.py --reyes
      python cargar_modulos.py --angeles
      python cargar_modulos.py --cristologia
      python cargar_modulos.py --numerologia
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

# ══════════════════════════════════════════════════════════════
# 1. REYES DE ISRAEL Y JUDÁ
# Fuente: Edwin Thiele, "The Mysterious Numbers of the Hebrew Kings"
# Verificado con 1 Reyes, 2 Reyes, 1 Crónicas, 2 Crónicas
# ══════════════════════════════════════════════════════════════

# Formato: (nombre, reino, inicio_ac, fin_ac, años_reinado, 
#           evaluacion, profeta_contemporaneo, referencia_principal,
#           cap_ref, vers_ref, nota)
# evaluacion: 'bueno' | 'malo' | 'mixto'
# reino: 'Israel' | 'Judá' | 'Unido'

REYES = [
    # ── REINO UNIDO ────────────────────────────────────────
    ('Saúl',      'Unido', 1050, 1010, 40, 'malo',   'Samuel',   '1 Samuel',    13, 1,
     'Primer rey de Israel. Rechazado por Dios por desobedecer. Murió en batalla contra los filisteos en el Monte Gilboa.'),
    ('David',     'Unido', 1010,  970, 40, 'bueno',  'Natán/Gad','2 Samuel',     2, 4,
     'Varón conforme al corazón de Dios. Estableció Jerusalén como capital. Autor de gran parte de los Salmos. Recibió el pacto davídico (2 Sam 7).'),
    ('Salomón',   'Unido',  970,  930, 40, 'mixto',  'Ahías',    '1 Reyes',      1,39,
     'Construyó el primer templo de Jerusalén. Reconocido por su sabiduría. Se desvió en sus últimos años por sus esposas extranjeras.'),

    # ── REINO DE JUDÁ (sur, tribu de Judá y Benjamín) ─────
    ('Roboam',    'Judá',  930,  913, 17, 'malo',   'Semaías',  '1 Reyes',     12, 1,
     'Hijo de Salomón. Su dureza causó la división del reino. Judá cayó en idolatría. Egipto saqueó el templo bajo Sisac.'),
    ('Abías',     'Judá',  913,  910,  3, 'mixto',  'Iddo',     '1 Reyes',     15, 1,
     'Hijo de Roboam. Venció a Jeroboam en batalla. Siguió los pecados de su padre aunque reconoció a Jehová.'),
    ('Asa',       'Judá',  910,  869, 41, 'bueno',  'Azarías',  '1 Reyes',     15,11,
     'Quitó los ídolos y reformó el culto. Gran reformador religioso. Venció al etíope Zera con un ejército enorme. Se apoyó en Siria al final de su vida.'),
    ('Josafat',   'Judá',  872,  848, 25, 'bueno',  'Jehú/Elías','1 Reyes',    22,41,
     'Uno de los mejores reyes de Judá. Envió levitas a enseñar la ley por todo Judá. Se alió con el malvado Acab de Israel.'),
    ('Joram',     'Judá',  848,  841,  8, 'malo',   'Elías',    '2 Reyes',      8,16,
     'Hijo de Josafat. Casado con Atalía, hija de Acab. Introdujo la idolatría en Judá. Edom y Libna se rebelaron contra él.'),
    ('Ocozías',   'Judá',  841,  841,  1, 'malo',   'Elías',    '2 Reyes',      8,25,
     'Reinó solo un año. Fue muerto por Jehú junto con Joram de Israel. Siguió el consejo de la casa de Acab.'),
    ('Atalía',    'Judá',  841,  835,  6, 'malo',   'Joiada',   '2 Reyes',     11, 1,
     'Única reina de Judá. Hija de Acab y Jezabel. Usurpó el trono matando a los hijos reales. Fue muerta en el templo.'),
    ('Joás',      'Judá',  835,  796, 40, 'mixto',  'Zacarías', '2 Reyes',     12, 1,
     'Escondido en el templo de niño. Reparó el templo. Fue bueno mientras vivió el sacerdote Joiada. Luego se desvió y mató a Zacarías hijo de Joiada.'),
    ('Amasías',   'Judá',  796,  767, 29, 'mixto',  None,       '2 Reyes',     14, 1,
     'Comenzó bien, venció a Edom. Luego adoró los dioses de Edom. Fue derrotado por Israel y murió en una conspiración.'),
    ('Uzías',     'Judá',  792,  740, 52, 'bueno',  'Isaías/Amós/Oseas','2 Reyes',15, 1,
     'También llamado Azarías. Largo y próspero reinado. Fue herido de lepra por entrar al templo a ofrecer incienso, función solo de los sacerdotes.'),
    ('Jotam',     'Judá',  750,  732, 16, 'bueno',  'Isaías/Miqueas','2 Reyes', 15,32,
     'Hijo de Uzías. Construyó la puerta superior del templo. Fue recto aunque el pueblo siguió corrompido.'),
    ('Acaz',      'Judá',  735,  715, 20, 'malo',   'Isaías',   '2 Reyes',     16, 1,
     'Uno de los peores reyes de Judá. Ofreció sus hijos al fuego. Cerró el templo. Se sometió a Asiria. En su tiempo Isaías anunció la señal de Emanuel (Is 7:14).'),
    ('Ezequías',  'Judá',  715,  686, 29, 'bueno',  'Isaías',   '2 Reyes',     18, 1,
     'Uno de los mejores reyes. Purificó el templo. Destruyó la serpiente de bronce. Jehová libró Jerusalén del asirio Senaquerib. Se le añadieron 15 años de vida.'),
    ('Manasés',   'Judá',  697,  642, 55, 'malo',   'Isaías',   '2 Reyes',     21, 1,
     'El reinado más largo de Judá. El más malvado — restauró ídolos, practicó ocultismo, derramó sangre inocente. Al final se arrepintió según 2 Crónicas 33.'),
    ('Amón',      'Judá',  642,  640,  2, 'malo',   None,       '2 Reyes',     21,19,
     'Siguió todos los pecados de su padre Manasés. Fue asesinado por sus siervos a los 2 años de reinado.'),
    ('Josías',    'Judá',  640,  609, 31, 'bueno',  'Jeremías/Sofonías/Hulda','2 Reyes',22, 1,
     'El mejor rey después de David. Encontró el libro de la ley. Gran reforma religiosa. Celebró la Pascua más grande desde los días de los jueces. Murió en Meguido contra Faraón Necao.'),
    ('Joacaz',    'Judá',  609,  609,  0, 'malo',   'Jeremías', '2 Reyes',     23,31,
     'Reinó solo 3 meses. Fue depuesto y llevado cautivo a Egipto por Faraón Necao. Murió allá.'),
    ('Joacim',    'Judá',  609,  598, 11, 'malo',   'Jeremías', '2 Reyes',     23,36,
     'Puesto por Faraón Necao. Quemó el rollo de Jeremías. Nabucodonosor lo sometió. Murió en el camino al cautiverio.'),
    ('Joaquín',   'Judá',  598,  597,  0, 'malo',   'Jeremías', '2 Reyes',     24, 8,
     'También llamado Conías. Reinó solo 3 meses. Fue llevado cautivo a Babilonia por Nabucodonosor con 10,000 personas.'),
    ('Sedequías', 'Judá',  597,  586, 11, 'malo',   'Jeremías/Ezequiel','2 Reyes',24,17,
     'Último rey de Judá. Nombrado por Nabucodonosor. Ignoró las advertencias de Jeremías. Jerusalén fue destruida y el templo quemado en 586 a.C.'),

    # ── REINO DE ISRAEL (norte, 10 tribus) ────────────────
    ('Jeroboam I','Israel', 930,  909, 22, 'malo',   'Ahías',    '1 Reyes',     12,20,
     'Primer rey del reino del norte. Estableció becerros de oro en Bet-el y Dan para evitar que el pueblo fuera a Jerusalén. Su pecado fue patrón para todos los reyes de Israel.'),
    ('Nadab',     'Israel', 909,  908,  2, 'malo',   None,       '1 Reyes',     15,25,
     'Hijo de Jeroboam. Asesinado por Baasa mientras sitiaba Gibetón. Se cumplió la profecía de Ahías.'),
    ('Baasa',     'Israel', 908,  886, 24, 'malo',   'Jehú',     '1 Reyes',     15,33,
     'Exterminó toda la casa de Jeroboam. Hizo guerra contra Judá. Siguió el pecado de Jeroboam.'),
    ('Ela',       'Israel', 886,  885,  2, 'malo',   None,       '1 Reyes',     16, 8,
     'Hijo de Baasa. Asesinado por Zimri mientras bebía en casa de su mayordomo.'),
    ('Zimri',     'Israel', 885,  885,  0, 'malo',   None,       '1 Reyes',     16,15,
     'Reinó solo 7 días. Exterminó la casa de Baasa. Cuando Omri marchó contra él, se quemó en el palacio.'),
    ('Omri',      'Israel', 885,  874, 12, 'malo',   'Elías',    '1 Reyes',     16,23,
     'Fundó Samaria como capital. Fue tan malvado que Asiria llamaba a Israel "casa de Omri". Estableció alianza con Fenicia casando a Acab con Jezabel.'),
    ('Acab',      'Israel', 874,  853, 22, 'malo',   'Elías/Miqueas','1 Reyes', 16,29,
     'El más malvado de los reyes de Israel. Casado con la fenicia Jezabel. Introdujo el culto a Baal. Mató a Nabot por su viña. Enfrentó a Elías en el Carmelo.'),
    ('Ocozías',   'Israel', 853,  852,  2, 'malo',   'Elías',    '1 Reyes',     22,51,
     'Hijo de Acab. Siguió el pecado de sus padres y de Jeroboam. Consultó a Baal-zebub de Ecrón cuando enfermó.'),
    ('Joram',     'Israel', 852,  841, 12, 'mixto',  'Elías/Eliseo','2 Reyes',   3, 1,
     'Hijo de Acab. Quitó la estatua de Baal pero mantuvo los becerros de Jeroboam. Fue herido por los sirios y muerto por Jehú.'),
    ('Jehú',      'Israel', 841,  814, 28, 'mixto',  'Eliseo',   '2 Reyes',      9, 1,
     'Ungido por Eliseo para destruir la casa de Acab. Mató a Joram, Jezabel y 70 hijos de Acab. Destruyó el templo de Baal. Pero mantuvo los pecados de Jeroboam.'),
    ('Joacaz',    'Israel', 814,  798, 17, 'malo',   'Eliseo',   '2 Reyes',     13, 1,
     'Hijo de Jehú. Israel fue gravemente oprimido por Siria bajo su reinado. Se humilló ante Jehová y Dios le dio un salvador.'),
    ('Joás',      'Israel', 798,  782, 16, 'malo',   'Eliseo',   '2 Reyes',     13,10,
     'Recuperó ciudades que Siria había tomado. Visitó a Eliseo en su lecho de muerte. Derrotó a Judá en Bet-semes.'),
    ('Jeroboam II','Israel',793,  753, 41, 'malo',   'Amós/Oseas','2 Reyes',   14,23,
     'El reinado más largo y próspero del norte. Restableció los límites de Israel. Pero gran pecado e injusticia social — Amós y Oseas profetizaron en su tiempo.'),
    ('Zacarías',  'Israel', 753,  752,  0, 'malo',   'Oseas',    '2 Reyes',     15, 8,
     'Hijo de Jeroboam II. Último rey de la dinastía de Jehú. Reinó 6 meses. Fue asesinado por Salum.'),
    ('Salum',     'Israel', 752,  752,  0, 'malo',   'Oseas',    '2 Reyes',     15,13,
     'Reinó solo 1 mes. Fue asesinado por Manahem.'),
    ('Manahem',   'Israel', 752,  742, 10, 'malo',   'Oseas',    '2 Reyes',     15,17,
     'Aplastó brutalmente la revuelta. Se sometió a Asiria pagando 1,000 talentos de plata a Pul (Tiglat-pileser III).'),
    ('Pekaía',    'Israel', 742,  740,  2, 'malo',   'Oseas',    '2 Reyes',     15,23,
     'Hijo de Manahem. Asesinado por Peka en el palacio.'),
    ('Peka',      'Israel', 752,  732, 20, 'malo',   'Isaías/Oseas','2 Reyes',  15,27,
     'Aliado con Siria atacó a Judá en los días de Acaz. Asiria tomó parte de Israel y llevó cautivos. Fue asesinado por Oseas.'),
    ('Oseas',     'Israel', 732,  722,  9, 'malo',   'Oseas',    '2 Reyes',     17, 1,
     'Último rey de Israel. Se alió con Egipto contra Asiria. Salmanasar V sitió Samaria por 3 años. En 722 a.C. Israel fue llevado cautivo y el reino terminó.'),
]

# ══════════════════════════════════════════════════════════════
# 2. ÁNGELES EN LA BIBLIA
# Fuente: concordancia bíblica RV1960, texto directo
# ══════════════════════════════════════════════════════════════

# Formato: (nombre, tipo, libro, cap, vers, descripcion, mision)
ANGELES = [
    # ── ÁNGELES NOMBRADOS ──────────────────────────────────
    ('Miguel',    'arcángel',   'Daniel',       10, 13,
     'Príncipe de Israel, uno de los príncipes principales. Luchó contra el príncipe de Persia.',
     'Guerrero celestial, protector de Israel, luchará en el tiempo del fin (Dn 12:1)'),

    ('Miguel',    'arcángel',   'Judas',         1,  9,
     'Contendió con el diablo disputando por el cuerpo de Moisés.',
     'Arcángel que resiste al diablo'),

    ('Miguel',    'arcángel',   'Apocalipsis',  12,  7,
     'Miguel y sus ángeles lucharon contra el dragón y sus ángeles.',
     'Comandante del ejército celestial en la guerra contra Satanás'),

    ('Gabriel',   'mensajero',  'Daniel',        8, 16,
     'Enviado para hacer entender a Daniel la visión.',
     'Intérprete de visiones proféticas'),

    ('Gabriel',   'mensajero',  'Daniel',        9, 21,
     'Voló con presteza para explicar a Daniel la profecía de las 70 semanas.',
     'Mensajero de las profecías del tiempo del fin'),

    ('Gabriel',   'mensajero',  'Lucas',         1, 19,
     'Se presentó ante Zacarías: Yo soy Gabriel que estoy delante de Dios.',
     'Anunció el nacimiento de Juan el Bautista'),

    ('Gabriel',   'mensajero',  'Lucas',         1, 26,
     'Enviado a Nazaret a María para anunciar el nacimiento del Mesías.',
     'Anunció la encarnación del Hijo de Dios'),

    # ── QUERUBINES ─────────────────────────────────────────
    ('Querubín guardián',  'querubín', 'Génesis',   3, 24,
     'Jehová puso querubines al oriente del Edén con espada llameante para guardar el árbol de la vida.',
     'Guardianes del acceso a la presencia de Dios'),

    ('Querubines del arca', 'querubín', 'Éxodo',   25, 20,
     'Los querubines extenderán sus alas por encima, cubriendo el propiciatorio con sus alas.',
     'Cubrían el propiciatorio — trono de Dios en la tierra'),

    ('Querubines del templo','querubín','1 Reyes',   6, 23,
     'Salomón hizo dos querubines de madera de olivo silvestre, de diez codos de altura cada uno.',
     'Guardianes del Lugar Santísimo del templo'),

    ('Querubines de Ezequiel','querubín','Ezequiel', 1,  5,
     'Cuatro seres vivientes con cuatro caras, cuatro alas y pies como becerro.',
     'Portadores del trono-carro de Dios (merkavá)'),

    ('Querubín cubridor',  'querubín', 'Ezequiel', 28, 14,
     'Tú, querubín grande, cubridor... en el monte santo de Dios estuviste.',
     'El ser que cayó — descripción de la caída de Satanás'),

    # ── SERAFINES ──────────────────────────────────────────
    ('Serafines',  'serafín',   'Isaías',        6,  2,
     'Serafines que tenían seis alas: con dos cubrían sus rostros, con dos cubrían sus pies y con dos volaban.',
     'Adoradores permanentes ante el trono de Dios, proclaman su santidad'),

    # ── EL ÁNGEL DE JEHOVÁ ─────────────────────────────────
    ('Ángel de Jehová', 'teofanía', 'Génesis',   16,  7,
     'Se apareció a Agar junto al manantial. Le dijo: De Jehová has sido oída.',
     'Primera aparición — generalmente identificado como una teofanía pre-encarnada de Cristo'),

    ('Ángel de Jehová', 'teofanía', 'Génesis',   22, 11,
     'Llamó a Abraham desde el cielo cuando iba a sacrificar a Isaac.',
     'Detuvo el sacrificio de Isaac'),

    ('Ángel de Jehová', 'teofanía', 'Éxodo',      3,  2,
     'Se le apareció en una llama de fuego en medio de una zarza.',
     'Llamó a Moisés para liberar a Israel de Egipto'),

    ('Ángel de Jehová', 'teofanía', 'Josué',      5, 14,
     'Príncipe del ejército de Jehová con espada desenvainada ante Josué.',
     'Se reveló a Josué antes de la conquista de Canaán'),

    ('Ángel de Jehová', 'teofanía', 'Jueces',      6, 12,
     'Se apareció a Gedeón y lo llamó varón esforzado y valiente.',
     'Llamó y comisionó a Gedeón'),

    ('Ángel de Jehová', 'teofanía', 'Jueces',     13,  3,
     'Se apareció a la esposa de Manoa para anunciar el nacimiento de Sansón.',
     'Anunció el nacimiento de Sansón'),

    ('Ángel de Jehová', 'teofanía', 'Zacarías',   1,  8,
     'Varón que estaba entre los mirtos en la hondonada.',
     'Intercede ante Jehová por Jerusalén y las ciudades de Judá'),

    # ── ÁNGELES EN EL NT ───────────────────────────────────
    ('Ángel en Getsemaní', 'mensajero', 'Lucas',  22, 43,
     'Se le apareció un ángel del cielo para fortalecerle.',
     'Fortaleció a Jesús en su agonía'),

    ('Ángel de la resurrección', 'mensajero', 'Mateo', 28, 2,
     'Un ángel del Señor descendió del cielo y llegando, removió la piedra y se sentó sobre ella.',
     'Removió la piedra del sepulcro y anunció la resurrección'),

    ('Ángel de Pentecostés', 'mensajero', 'Hechos', 1, 10,
     'Dos varones con vestiduras blancas se pusieron junto a los discípulos.',
     'Anunciaron la segunda venida de Cristo'),

    ('Ángel a Cornelio', 'mensajero', 'Hechos',   10,  3,
     'Vio claramente en una visión a un ángel de Dios que le decía: Cornelio.',
     'Instruyó a Cornelio para buscar a Pedro, abriendo el evangelio a los gentiles'),

    ('Ángel a Pedro', 'mensajero', 'Hechos',      12,  7,
     'Un ángel del Señor vino sobre él, y le golpeó el costado, le levantó.',
     'Liberó a Pedro de la prisión de Herodes'),

    ('Ángel del Apocalipsis', 'mensajero', 'Apocalipsis', 22, 16,
     'Yo Jesús he enviado mi ángel para daros testimonio de estas cosas en las iglesias.',
     'Mensajero del Apocalipsis a Juan'),

    # ── EJÉRCITOS CELESTIALES ──────────────────────────────
    ('Ejército celestial en Belén', 'hueste', 'Lucas', 2, 13,
     'De repente apareció con el ángel una multitud de las huestes celestiales que alababan a Dios.',
     'Anunciaron el nacimiento del Mesías a los pastores'),

    ('Ángeles ministradores', 'mensajero', 'Hebreos', 1, 14,
     '¿No son todos espíritus ministradores, enviados para servicio a favor de los que serán herederos de la salvación?',
     'Sirven a los herederos de la salvación'),

    ('Ángel de la guarda', 'mensajero', 'Mateo', 18, 10,
     'Sus ángeles en los cielos ven siempre el rostro de mi Padre que está en los cielos.',
     'Ángeles asignados a los pequeños — los creyentes'),

    # ── ÁNGELES EN APOCALIPSIS ─────────────────────────────
    ('Los 4 ángeles de los vientos', 'juicio', 'Apocalipsis', 7, 1,
     'Vi a cuatro ángeles en pie sobre los cuatro ángulos de la tierra, deteniendo los cuatro vientos.',
     'Controlan los vientos de juicio hasta que los siervos de Dios sean sellados'),

    ('El ángel con el incensario', 'intercesor', 'Apocalipsis', 8, 3,
     'Otro ángel vino con un incensario de oro... le fue dado mucho incienso para añadirlo a las oraciones de todos los santos.',
     'Presenta las oraciones de los santos ante Dios'),

    ('Los 7 ángeles de las trompetas', 'juicio', 'Apocalipsis', 8, 6,
     'Los siete ángeles que tenían las siete trompetas se dispusieron a tocarlas.',
     'Ejecutan los siete juicios de trompeta sobre la tierra'),

    ('El ángel fuerte', 'mensajero', 'Apocalipsis', 10, 1,
     'Vi descender del cielo a otro ángel fuerte, envuelto en una nube, con el arco iris sobre su cabeza.',
     'Proclama que el misterio de Dios se consumará'),

    ('Los 7 ángeles de las copas', 'juicio', 'Apocalipsis', 15, 1,
     'Vi en el cielo otra señal grande y admirable: siete ángeles que tenían las siete plagas postreras.',
     'Ejecutan los juicios finales de las siete copas'),
]

# ══════════════════════════════════════════════════════════════
# 3. TÍTULOS Y NOMBRES DEL MESÍAS (CRISTOLOGÍA)
# Fuente: texto bíblico RV1960 directo
# ══════════════════════════════════════════════════════════════

# Formato: (titulo, categoria, libro, cap, vers, contexto)
# categorias: 'divino' | 'profético' | 'sacerdotal' | 'real' | 'redentor' | 'pastor'

TITULOS_MESIAS = [
    # ── NOMBRES DIVINOS ─────────────────────────────────────
    ('Verbo (Logos)',          'divino',     'Juan',         1,  1, 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.'),
    ('YO SOY',                 'divino',     'Juan',         8, 58, 'Antes que Abraham fuese, yo soy.'),
    ('Hijo de Dios',           'divino',     'Mateo',        3, 17, 'Este es mi Hijo amado, en quien tengo complacencia.'),
    ('Hijo Unigénito',         'divino',     'Juan',         3, 16, 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito.'),
    ('Emmanuel / Dios con nosotros','divino','Mateo',        1, 23, 'Todo esto aconteció para que se cumpliese lo dicho por el Señor por medio del profeta: He aquí, una virgen concebirá y dará a luz un hijo, y llamarás su nombre Emanuel.'),
    ('Alfa y Omega',           'divino',     'Apocalipsis',  1,  8, 'Yo soy el Alfa y la Omega, principio y fin, dice el Señor.'),
    ('El Primero y el Último', 'divino',     'Apocalipsis',  1, 17, 'No temas; yo soy el primero y el último.'),
    ('El que es, era y ha de venir','divino','Apocalipsis',  1,  4, 'Gracia y paz a vosotros, del que es y que era y que ha de venir.'),
    ('Dios Fuerte',            'divino',     'Isaías',       9,  6, 'Y se llamará su nombre: Admirable, Consejero, Dios Fuerte, Padre Eterno, Príncipe de Paz.'),
    ('Padre Eterno',           'divino',     'Isaías',       9,  6, 'Su nombre: Padre Eterno.'),

    # ── TÍTULOS PROFÉTICOS ─────────────────────────────────
    ('Profeta como Moisés',    'profético',  'Deuteronomio',18, 15, 'Profeta de en medio de ti, de tus hermanos, como yo, te levantará Jehová tu Dios; a él oiréis.'),
    ('El que había de venir',  'profético',  'Mateo',       11,  3, '¿Eres tú el que había de venir, o esperaremos a otro?'),
    ('Maestro',                'profético',  'Juan',         3,  2, 'Rabí, sabemos que has venido de Dios como maestro.'),
    ('Rabi',                   'profético',  'Juan',         1, 38, 'Rabí (que traducido es, Maestro), ¿dónde moras?'),
    ('El Renuevo',             'profético',  'Jeremías',    23,  5, 'He aquí que vienen días, dice Jehová, en que levantaré a David Renuevo justo.'),
    ('La Estrella de Jacob',   'profético',  'Números',     24, 17, 'Lo veré, mas no ahora; lo miraré, mas no de cerca; saldrá ESTRELLA de Jacob.'),
    ('El Hijo del Hombre',     'profético',  'Daniel',       7, 13, 'Con las nubes del cielo venía uno como un hijo de hombre.'),
    ('Admirable Consejero',    'profético',  'Isaías',       9,  6, 'Y se llamará su nombre: Admirable, Consejero.'),

    # ── TÍTULOS REALES ─────────────────────────────────────
    ('Rey de Israel',          'real',       'Juan',         1, 49, 'Rabí, tú eres el Hijo de Dios; tú eres el Rey de Israel.'),
    ('Rey de reyes',           'real',       'Apocalipsis', 19, 16, 'Y en su vestidura y en su muslo tiene escrito este nombre: REY DE REYES Y SEÑOR DE SEÑORES.'),
    ('Señor de señores',       'real',       'Apocalipsis', 19, 16, 'REY DE REYES Y SEÑOR DE SEÑORES.'),
    ('Hijo de David',          'real',       'Mateo',        9, 27, 'Dos ciegos le seguían, dando voces y diciendo: ¡Ten misericordia de nosotros, Hijo de David!'),
    ('León de la tribu de Judá','real',      'Apocalipsis',  5,  5, 'He aquí que el León de la tribu de Judá, la raíz de David, ha vencido.'),
    ('Raíz de David',          'real',       'Apocalipsis',  5,  5, 'La raíz de David, ha vencido para abrir el libro.'),
    ('Príncipe de paz',        'real',       'Isaías',       9,  6, 'Príncipe de Paz.'),
    ('Príncipe de los príncipes','real',     'Daniel',       8, 25, 'Se levantará contra el Príncipe de los príncipes, pero será quebrantado.'),

    # ── TÍTULOS SACERDOTALES ───────────────────────────────
    ('Sumo Sacerdote',         'sacerdotal', 'Hebreos',      4, 14, 'Teniendo un gran sumo sacerdote que traspasó los cielos, Jesús el Hijo de Dios.'),
    ('Sacerdote según Melquisedec','sacerdotal','Salmos',   110,  4, 'Tú eres sacerdote para siempre según el orden de Melquisedec.'),
    ('Mediador',               'sacerdotal', '1 Timoteo',    2,  5, 'Porque hay un solo Dios, y un solo mediador entre Dios y los hombres, Jesucristo hombre.'),
    ('Intercesor',             'sacerdotal', 'Romanos',      8, 34, 'Cristo es el que murió; más aun, el que también resucitó, el que además está a la diestra de Dios, el que también intercede por nosotros.'),
    ('Abogado',                'sacerdotal', '1 Juan',       2,  1, 'Abogado tenemos para con el Padre, a Jesucristo el justo.'),

    # ── TÍTULOS REDENTORES ─────────────────────────────────
    ('Salvador',               'redentor',   'Lucas',        2, 11, 'Os ha nacido hoy, en la ciudad de David, un Salvador, que es CRISTO el Señor.'),
    ('Cordero de Dios',        'redentor',   'Juan',         1, 29, 'He aquí el Cordero de Dios, que quita el pecado del mundo.'),
    ('Redentor',               'redentor',   'Job',         19, 25, 'Yo sé que mi Redentor vive, y al fin se levantará sobre el polvo.'),
    ('Propiciación',           'redentor',   '1 Juan',       2,  2, 'Él es la propiciación por nuestros pecados; y no solamente por los nuestros, sino también por los de todo el mundo.'),
    ('Siervo sufriente',       'redentor',   'Isaías',      53,  3, 'Despreciado y desechado entre los hombres, varón de dolores, experimentado en quebranto.'),
    ('Cordero sin defecto',    'redentor',   '1 Pedro',      1, 19, 'Sino con la sangre preciosa de Cristo, como de un cordero sin mancha y sin contaminación.'),
    ('Pan de vida',            'redentor',   'Juan',         6, 35, 'Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre.'),
    ('Agua de vida',           'redentor',   'Juan',         4, 14, 'El agua que yo le daré será en él una fuente de agua que salte para vida eterna.'),
    ('Resurrección y vida',    'redentor',   'Juan',        11, 25, 'Yo soy la resurrección y la vida; el que cree en mí, aunque esté muerto, vivirá.'),

    # ── TÍTULOS DE PASTOR ──────────────────────────────────
    ('El Buen Pastor',         'pastor',     'Juan',        10, 11, 'Yo soy el buen pastor; el buen pastor su vida da por las ovejas.'),
    ('El Gran Pastor',         'pastor',     'Hebreos',     13, 20, 'El Dios de paz que resucitó de los muertos a nuestro Señor Jesucristo, el gran pastor de las ovejas.'),
    ('Príncipe de los pastores','pastor',    '1 Pedro',      5,  4, 'Y cuando aparezca el Príncipe de los pastores, vosotros recibiréis la corona incorruptible de gloria.'),

    # ── TÍTULOS DE SABIDURÍA ───────────────────────────────
    ('Camino, Verdad y Vida',  'divino',     'Juan',        14,  6, 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.'),
    ('La Vid verdadera',       'pastor',     'Juan',        15,  1, 'Yo soy la vid verdadera, y mi Padre es el labrador.'),
    ('La Luz del mundo',       'divino',     'Juan',         8, 12, 'Yo soy la luz del mundo; el que me sigue, no andará en tinieblas.'),
    ('La Puerta',              'pastor',     'Juan',        10,  9, 'Yo soy la puerta; el que por mí entrare, será salvo.'),
    ('La Resurrección',        'redentor',   'Juan',        11, 25, 'Yo soy la resurrección y la vida.'),
    ('El Verdadero',           'divino',     'Juan',        15,  1, 'Yo soy la vid verdadera.'),
]

# ══════════════════════════════════════════════════════════════
# 4. NÚMEROS BÍBLICOS SIGNIFICATIVOS
# Fuente: concordancia bíblica, texto RV1960
# ══════════════════════════════════════════════════════════════

# Formato: (numero, nombre, significado, libro, cap, vers, contexto, tipo)
NUMEROS = [
    (1,   'Uno',             'Unidad, unicidad de Dios',
     'Deuteronomio', 6, 4, 'Jehová nuestro Dios, Jehová uno es.',
     'teológico'),

    (3,   'Tres',            'Trinidad, completitud divina, resurrección',
     'Mateo',        12, 40, 'Como estuvo Jonás tres días y tres noches en el vientre del gran pez, así estará el Hijo del Hombre tres días y tres noches en el corazón de la tierra.',
     'divino'),

    (4,   'Cuatro',          'Creación, los cuatro puntos cardinales, universalidad',
     'Apocalipsis',   7,  1, 'Cuatro ángeles en pie sobre los cuatro ángulos de la tierra.',
     'creación'),

    (6,   'Seis',            'Número del hombre, imperfección',
     'Génesis',       1, 31, 'Dios creó al hombre en el sexto día.',
     'humano'),

    (7,   'Siete',           'Perfección, completitud, número de Dios',
     'Génesis',       2,  2, 'Reposó el día séptimo de toda la obra que hizo.',
     'divino'),

    (10,  'Diez',            'Plenitud de orden humano, ley',
     'Éxodo',        20,  1, 'Los Diez Mandamientos dados en el Sinaí.',
     'legal'),

    (12,  'Doce',            'Gobierno divino, las tribus, los apóstoles',
     'Mateo',        10,  1, 'Llamando a sus doce discípulos, les dio autoridad.',
     'gobierno'),

    (14,  'Catorce',         'Doble de siete, redención',
     'Mateo',         1, 17, 'Catorce generaciones desde Abraham hasta David, catorce hasta la deportación, catorce hasta el Cristo.',
     'profético'),

    (24,  'Veinticuatro',    'Los 24 ancianos, doble de doce',
     'Apocalipsis',   4,  4, 'Veinticuatro ancianos sentados vestidos de ropas blancas, con coronas de oro en sus cabezas.',
     'celestial'),

    (30,  'Treinta',         'Madurez para el ministerio sacerdotal',
     'Números',       4,  3, 'De treinta años arriba hasta cincuenta años, todos los que entran en compañía para hacer la obra.',
     'sacerdotal'),

    (40,  'Cuarenta',        'Prueba, peregrinación, preparación',
     'Mateo',         4,  2, 'Y después de haber ayunado cuarenta días y cuarenta noches, tuvo hambre.',
     'prueba'),

    (42,  'Cuarenta y dos',  'Período de tribulación',
     'Apocalipsis',  13,  5, 'Se le dio autoridad para actuar cuarenta y dos meses.',
     'profético'),

    (50,  'Cincuenta',       'Jubileo, Pentecostés, libertad',
     'Levítico',     25, 10, 'Santificaréis el año cincuenta, y pregonaréis libertad en la tierra.',
     'redentor'),

    (70,  'Setenta',         'Plenitud de generaciones, período profético',
     'Daniel',        9, 24, 'Setenta semanas están determinadas sobre tu pueblo.',
     'profético'),

    (144000, 'Ciento cuarenta y cuatro mil', 'Los sellados de Israel, 12 x 12 x 1000',
     'Apocalipsis',   7,  4, 'Oí el número de los sellados: ciento cuarenta y cuatro mil sellados de todas las tribus de los hijos de Israel.',
     'escatológico'),

    (666, 'Seiscientos sesenta y seis', 'Número de la bestia, triple imperfección del hombre',
     'Apocalipsis',  13, 18, 'Aquí hay sabiduría. El que tiene entendimiento, cuente el número de la bestia, pues es número de hombre. Y su número es seiscientos sesenta y seis.',
     'escatológico'),

    (1000, 'Mil',            'Número grande, el milenio',
     'Apocalipsis',  20,  4, 'Y reinaron con Cristo mil años.',
     'escatológico'),

    (153,  'Ciento cincuenta y tres', 'Los peces de la pesca milagrosa',
     'Juan',         21, 11, 'Subió Simón Pedro y sacó la red a tierra, llena de grandes peces, ciento cincuenta y tres.',
     'simbólico'),

    (8,   'Ocho',            'Nuevo comienzo, resurrección (Jesús resucitó el 8° día)',
     'Juan',         20, 26, 'Ocho días después, estaban otra vez sus discípulos dentro, y con ellos Tomás.',
     'redentor'),

    (5,   'Cinco',           'Gracia, los cinco libros de Moisés',
     'Juan',          6,  9, 'Aquí está un muchacho, que tiene cinco panes de cebada y dos pececillos.',
     'gracia'),
]

# ══════════════════════════════════════════════════════════════
# CREAR TABLAS
# ══════════════════════════════════════════════════════════════

SQL_TABLAS = """
-- Reyes
CREATE TABLE IF NOT EXISTS reyes (
    id                  SERIAL PRIMARY KEY,
    nombre              TEXT NOT NULL,
    reino               TEXT NOT NULL CHECK (reino IN ('Israel','Judá','Unido')),
    inicio_ac           INTEGER,
    fin_ac              INTEGER,
    anos_reinado        INTEGER,
    evaluacion          TEXT CHECK (evaluacion IN ('bueno','malo','mixto')),
    profeta_contemporaneo TEXT,
    libro_referencia    TEXT,
    cap_referencia      INTEGER,
    vers_referencia     INTEGER,
    nota                TEXT,
    versiculo_id        INTEGER REFERENCES versiculos(id)
);

-- Ángeles
CREATE TABLE IF NOT EXISTS angeles (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    tipo        TEXT NOT NULL,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    descripcion TEXT,
    mision      TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Títulos del Mesías
CREATE TABLE IF NOT EXISTS titulos_mesias (
    id          SERIAL PRIMARY KEY,
    titulo      TEXT NOT NULL,
    categoria   TEXT NOT NULL,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    contexto    TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Números bíblicos
CREATE TABLE IF NOT EXISTS numeros_biblicos (
    id          SERIAL PRIMARY KEY,
    numero      INTEGER NOT NULL,
    nombre      TEXT NOT NULL,
    significado TEXT NOT NULL,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    contexto    TEXT,
    tipo        TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);
"""

# ══════════════════════════════════════════════════════════════
# FUNCIONES DE CARGA
# ══════════════════════════════════════════════════════════════

def get_versiculo_id(cur, libro_nombre, capitulo, versiculo):
    cur.execute("""
        SELECT v.id FROM versiculos v
        JOIN capitulos c ON v.capitulo_id = c.id
        JOIN libros l    ON v.libro_id = l.id
        WHERE l.nombre = %s AND c.numero = %s AND v.numero = %s
    """, (libro_nombre, capitulo, versiculo))
    row = cur.fetchone()
    return row[0] if row else None

def cargar_reyes(cur):
    print("\n👑  Cargando reyes de Israel y Judá...")
    cur.execute("TRUNCATE TABLE reyes RESTART IDENTITY")
    ok = 0
    for rey in REYES:
        (nombre, reino, inicio, fin, anos, eval_, profeta,
         libro_ref, cap_ref, vers_ref, nota) = rey
        vid = get_versiculo_id(cur, libro_ref, cap_ref, vers_ref)
        cur.execute("""
            INSERT INTO reyes (nombre, reino, inicio_ac, fin_ac, anos_reinado,
                evaluacion, profeta_contemporaneo, libro_referencia,
                cap_referencia, vers_referencia, nota, versiculo_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (nombre, reino, inicio, fin, anos, eval_, profeta,
              libro_ref, cap_ref, vers_ref, nota, vid))
        ok += 1
    print(f"  ✅  {ok} reyes insertados")

def cargar_angeles(cur):
    print("\n🕊️   Cargando ángeles bíblicos...")
    cur.execute("TRUNCATE TABLE angeles RESTART IDENTITY")
    ok = 0; err = 0
    for a in ANGELES:
        (nombre, tipo, libro, cap, vers, desc, mision) = a
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid: err += 1
        cur.execute("""
            INSERT INTO angeles (nombre, tipo, libro, capitulo, versiculo,
                descripcion, mision, versiculo_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (nombre, tipo, libro, cap, vers, desc, mision, vid))
        ok += 1
    print(f"  ✅  {ok} entradas | {err} versículos no enlazados")

def cargar_titulos(cur):
    print("\n✝️   Cargando títulos del Mesías...")
    cur.execute("TRUNCATE TABLE titulos_mesias RESTART IDENTITY")
    ok = 0; err = 0
    for t in TITULOS_MESIAS:
        (titulo, cat, libro, cap, vers, ctx) = t
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid: err += 1
        cur.execute("""
            INSERT INTO titulos_mesias (titulo, categoria, libro, capitulo,
                versiculo, contexto, versiculo_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (titulo, cat, libro, cap, vers, ctx, vid))
        ok += 1
    print(f"  ✅  {ok} títulos insertados | {err} versículos no enlazados")

def cargar_numeros(cur):
    print("\n🔢  Cargando números bíblicos...")
    cur.execute("TRUNCATE TABLE numeros_biblicos RESTART IDENTITY")
    ok = 0; err = 0
    for n in NUMEROS:
        (num, nombre, signif, libro, cap, vers, ctx, tipo) = n
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid: err += 1
        cur.execute("""
            INSERT INTO numeros_biblicos (numero, nombre, significado, libro,
                capitulo, versiculo, contexto, tipo, versiculo_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (num, nombre, signif, libro, cap, vers, ctx, tipo, vid))
        ok += 1
    print(f"  ✅  {ok} números insertados | {err} versículos no enlazados")

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    args = sys.argv[1:]
    todo       = '--todo'        in args
    reyes      = '--reyes'       in args or todo
    angeles    = '--angeles'     in args or todo
    cristologia= '--cristologia' in args or todo
    numerologia= '--numerologia' in args or todo

    if not any([reyes, angeles, cristologia, numerologia]):
        print("Uso: python cargar_modulos.py --todo")
        print("     python cargar_modulos.py --reyes --angeles --cristologia --numerologia")
        sys.exit(0)

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    # Crear tablas
    print("📋  Creando tablas...")
    cur.execute(SQL_TABLAS)
    conn.commit()
    print("  ✅  Tablas creadas")

    if reyes:       cargar_reyes(cur)
    if angeles:     cargar_angeles(cur)
    if cristologia: cargar_titulos(cur)
    if numerologia: cargar_numeros(cur)

    conn.commit()
    cur.close(); conn.close()
    print("\n🎉  Todos los módulos cargados exitosamente.")