"""
============================================================
 CARGADOR DE NEUMATOLOGÍA → NEON
 Estudio completo del Espíritu Santo en la Biblia RV1960

 Fuentes:
 - Texto bíblico RV1960 (ya en DB)
 - Teología Sistemática: Wayne Grudem
 - Teología Bíblica: Charles Ryrie
 - Strong's Concordance (H7307 ruach, G4151 pneuma)

 Uso: python cargar_neumatologia.py
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
# TABLAS SQL
# ══════════════════════════════════════════════════════════════
SQL_TABLAS = """
-- Nombres y títulos del Espíritu Santo
CREATE TABLE IF NOT EXISTS espiritusanto_nombres (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    hebreo_griego TEXT,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    contexto    TEXT,
    categoria   TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Obras del Espíritu Santo
CREATE TABLE IF NOT EXISTS espiritusanto_obras (
    id          SERIAL PRIMARY KEY,
    obra        TEXT NOT NULL,
    descripcion TEXT,
    etapa       TEXT NOT NULL,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    texto_clave TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Símbolos del Espíritu Santo
CREATE TABLE IF NOT EXISTS espiritusanto_simbolos (
    id          SERIAL PRIMARY KEY,
    simbolo     TEXT NOT NULL,
    significado TEXT NOT NULL,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    contexto    TEXT,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Dones del Espíritu
CREATE TABLE IF NOT EXISTS espiritusanto_dones (
    id          SERIAL PRIMARY KEY,
    don         TEXT NOT NULL,
    descripcion TEXT,
    categoria   TEXT,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Fruto del Espíritu
CREATE TABLE IF NOT EXISTS espiritusanto_fruto (
    id          SERIAL PRIMARY KEY,
    fruto       TEXT NOT NULL,
    descripcion TEXT,
    libro       TEXT NOT NULL,
    capitulo    INTEGER NOT NULL,
    versiculo   INTEGER NOT NULL,
    versiculo_id INTEGER REFERENCES versiculos(id)
);

-- Apariciones por libro (resumen)
CREATE TABLE IF NOT EXISTS espiritusanto_por_libro (
    id          SERIAL PRIMARY KEY,
    libro       TEXT NOT NULL,
    total_menciones INTEGER DEFAULT 0,
    resumen     TEXT,
    versiculo_clave_libro TEXT,
    versiculo_clave_cap  INTEGER,
    versiculo_clave_vers INTEGER,
    versiculo_id INTEGER REFERENCES versiculos(id)
);
"""

# ══════════════════════════════════════════════════════════════
# DATOS
# ══════════════════════════════════════════════════════════════

# Formato: (nombre, hebreo_griego, libro, cap, vers, contexto, categoria)
# categorias: 'divino' | 'relacional' | 'funcional' | 'profético' | 'soteriológico'
NOMBRES = [
    # ── NOMBRES EN EL ANTIGUO TESTAMENTO ───────────────────
    ('Espíritu de Dios',        'H7307 רוּחַ אֱלֹהִים (Ruach Elohim)',
     'Génesis',       1,  2,
     'El Espíritu de Dios se movía sobre la faz de las aguas.',
     'divino'),
    ('Espíritu de Dios',        'H7307 רוּחַ אֱלֹהִים',
     'Génesis',      41, 38,
     'Y dijo Faraón a sus siervos: ¿Acaso hallaremos a otro hombre como éste, en quien esté el espíritu de Dios?',
     'divino'),
    ('Espíritu de Jehová',      'H7307 רוּחַ יְהוָה (Ruach Yahweh)',
     'Jueces',         3, 10,
     'Y el Espíritu de Jehová vino sobre él; y juzgó a Israel.',
     'divino'),
    ('Espíritu de Jehová',      'H7307 רוּחַ יְהוָה',
     'Isaías',        61,  1,
     'El Espíritu de Jehová el Señor está sobre mí, porque me ungió Jehová.',
     'divino'),
    ('Espíritu Santo',          'H6944 רוּחַ קָדְשְׁךָ (Ruach Qodesh)',
     'Salmos',        51, 11,
     'No me eches de delante de ti, y no quites de mí tu santo espíritu.',
     'divino'),
    ('Mi Espíritu',             'H7307 רוּחִי',
     'Génesis',        6,  3,
     'Y dijo Jehová: No contenderá mi espíritu con el hombre para siempre.',
     'divino'),
    ('Espíritu de sabiduría',   'H7307 + H2451 חָכְמָה',
     'Éxodo',         28,  3,
     'Y tú hablarás a todos los sabios de corazón, a quienes yo he llenado de espíritu de sabiduría.',
     'funcional'),
    ('Espíritu de sabiduría e inteligencia', 'H7307 חָכְמָה וּבִינָה',
     'Isaías',        11,  2,
     'Y reposará sobre él el Espíritu de Jehová; espíritu de sabiduría y de inteligencia.',
     'funcional'),
    ('Espíritu de consejo y de poder', 'H7307 עֵצָה וּגְבוּרָה',
     'Isaías',        11,  2,
     'Espíritu de consejo y de poder, espíritu de conocimiento y de temor de Jehová.',
     'funcional'),
    ('Mi Espíritu sobre toda carne', 'H7307 רוּחִי',
     'Joel',           2, 28,
     'Derramaré mi Espíritu sobre toda carne, y profetizarán vuestros hijos y vuestras hijas.',
     'profético'),

    # ── NOMBRES EN EL NUEVO TESTAMENTO ─────────────────────
    ('Espíritu Santo',          'G40 ἅγιον πνεῦμα (Hagion Pneuma)',
     'Mateo',          1, 18,
     'El nacimiento de Jesucristo fue así: su madre María... se halló que había concebido del Espíritu Santo.',
     'divino'),
    ('Consolador',              'G3875 παράκλητος (Parakletos)',
     'Juan',          14, 16,
     'Y yo rogaré al Padre, y os dará otro Consolador, para que esté con vosotros para siempre.',
     'relacional'),
    ('Espíritu de verdad',      'G4151 πνεῦμα τῆς ἀληθείας',
     'Juan',          14, 17,
     'El Espíritu de verdad, al cual el mundo no puede recibir, porque no le ve, ni le conoce.',
     'funcional'),
    ('Espíritu de verdad',      'G4151 πνεῦμα τῆς ἀληθείας',
     'Juan',          16, 13,
     'Pero cuando venga el Espíritu de verdad, él os guiará a toda la verdad.',
     'funcional'),
    ('Espíritu de adopción',    'G4151 πνεῦμα υἱοθεσίας',
     'Romanos',        8, 15,
     'Pues no habéis recibido el espíritu de esclavitud para estar otra vez en temor, sino que habéis recibido el espíritu de adopción.',
     'soteriológico'),
    ('Espíritu de vida',        'G4151 πνεῦμα τῆς ζωῆς',
     'Romanos',        8,  2,
     'La ley del Espíritu de vida en Cristo Jesús me ha librado de la ley del pecado y de la muerte.',
     'soteriológico'),
    ('Espíritu de aquel que levantó a Jesús', 'G4151 πνεῦμα',
     'Romanos',        8, 11,
     'Y si el Espíritu de aquel que levantó de los muertos a Jesús mora en vosotros, el que levantó de los muertos a Cristo Jesús vivificará también vuestros cuerpos mortales.',
     'divino'),
    ('Espíritu de Cristo',      'G4151 πνεῦμα Χριστοῦ',
     'Romanos',        8,  9,
     'Si alguno no tiene el Espíritu de Cristo, no es de él.',
     'divino'),
    ('Espíritu de santidad',    'G4151 πνεῦμα ἁγιωσύνης',
     'Romanos',        1,  4,
     'Que fue declarado Hijo de Dios con poder, según el Espíritu de santidad.',
     'divino'),
    ('Espíritu prometido',      'G4151 τοῦ ἐπαγγελίας',
     'Efesios',        1, 13,
     'En él también vosotros... fuisteis sellados con el Espíritu Santo de la promesa.',
     'soteriológico'),
    ('Espíritu de gracia',      'G4151 πνεῦμα τῆς χάριτος',
     'Hebreos',       10, 29,
     'El que pisoteare al Hijo de Dios... e hiciere afrenta al Espíritu de gracia.',
     'soteriológico'),
    ('Los siete Espíritus',     'G4151 ἑπτὰ πνεύματα',
     'Apocalipsis',    1,  4,
     'Los siete espíritus que están delante de su trono — la plenitud del Espíritu.',
     'divino'),
    ('Espíritu y la Esposa',    'G4151 πνεῦμα',
     'Apocalipsis',   22, 17,
     'Y el Espíritu y la Esposa dicen: Ven.',
     'profético'),
]

# Formato: (obra, descripcion, etapa, libro, cap, vers, texto_clave)
# etapas: 'creacion' | 'AT' | 'vida_jesus' | 'pentecostes' | 'iglesia' | 'creyente' | 'fin'
OBRAS = [
    # ── EN LA CREACIÓN ─────────────────────────────────────
    ('Participó en la creación',
     'El Espíritu de Dios se movía sobre la faz de las aguas antes de la creación ordenada.',
     'creacion', 'Génesis', 1, 2,
     'El Espíritu de Dios se movía sobre la faz de las aguas.'),
    ('Da vida a los seres vivos',
     'El aliento de vida infundido por Dios en el hombre es el espíritu vivificador.',
     'creacion', 'Génesis', 2, 7,
     'Sopló en su nariz aliento de vida, y fue el hombre un ser viviente.'),
    ('Sostiene la creación',
     'El Espíritu de Dios mantiene en existencia toda la creación.',
     'creacion', 'Job', 33, 4,
     'El espíritu de Dios me hizo, y el soplo del Omnipotente me dio vida.'),

    # ── EN EL ANTIGUO TESTAMENTO ───────────────────────────
    ('Capacitó a artesanos para construir el tabernáculo',
     'Bezaleel fue llenado del Espíritu de Dios en sabiduría para construir el tabernáculo.',
     'AT', 'Éxodo', 31, 3,
     'Y lo he llenado del Espíritu de Dios, en sabiduría y en inteligencia, en ciencia y en todo arte.'),
    ('Vino sobre los jueces para liberar a Israel',
     'El Espíritu equipó a los jueces con poder sobrenatural para liberar al pueblo.',
     'AT', 'Jueces', 3, 10,
     'Y el Espíritu de Jehová vino sobre él; y juzgó a Israel.'),
    ('Vino sobre Sansón con poder',
     'El Espíritu dio a Sansón fuerza sobrenatural para sus hazañas.',
     'AT', 'Jueces', 14, 6,
     'Y el Espíritu de Jehová vino sobre él, y lo despedazó como se despedaza un cabrito.'),
    ('Ungió a David como rey',
     'Desde el día de su unción, el Espíritu estuvo sobre David.',
     'AT', '1 Samuel', 16, 13,
     'Y desde aquel día el Espíritu de Jehová vino sobre David.'),
    ('Habló por los profetas',
     'Toda profecía del AT fue dada por inspiración del Espíritu Santo.',
     'AT', '2 Pedro', 1, 21,
     'Los santos hombres de Dios hablaron siendo inspirados por el Espíritu Santo.'),
    ('Prometido para el derramamiento final',
     'Joel profetizó el derramamiento del Espíritu sobre toda carne en los últimos días.',
     'AT', 'Joel', 2, 28,
     'Derramaré mi Espíritu sobre toda carne.'),
    ('Llenó a Elisabet al saludarla María',
     'La primera manifestación del Espíritu en el NT fue en Elisabet al escuchar el saludo de María.',
     'AT', 'Lucas', 1, 41,
     'Y aconteció que cuando oyó Elisabet la salutación de María, la criatura saltó en su vientre; y Elisabet fue llena del Espíritu Santo.'),

    # ── EN LA VIDA DE JESÚS ────────────────────────────────
    ('Concibió a Jesús en María',
     'La encarnación del Hijo de Dios fue obra del Espíritu Santo.',
     'vida_jesus', 'Lucas', 1, 35,
     'El Espíritu Santo vendrá sobre ti, y el poder del Altísimo te cubrirá con su sombra.'),
    ('Descendió sobre Jesús en el bautismo',
     'El Espíritu descendió en forma de paloma sobre Jesús al ser bautizado.',
     'vida_jesus', 'Mateo', 3, 16,
     'Vio al Espíritu de Dios que descendía como paloma, y venía sobre él.'),
    ('Llevó a Jesús al desierto para ser tentado',
     'El Espíritu dirigió a Jesús al desierto para la tentación antes de su ministerio.',
     'vida_jesus', 'Mateo', 4, 1,
     'Entonces Jesús fue llevado por el Espíritu al desierto.'),
    ('Ungió a Jesús para su ministerio',
     'Jesús fue ungido con el Espíritu Santo y con poder para hacer el bien.',
     'vida_jesus', 'Lucas', 4, 18,
     'El Espíritu del Señor está sobre mí, por cuanto me ha ungido para dar buenas nuevas a los pobres.'),
    ('Realizó milagros por el Espíritu',
     'Los milagros de Jesús fueron realizados en el poder del Espíritu Santo.',
     'vida_jesus', 'Mateo', 12, 28,
     'Pero si yo por el Espíritu de Dios echo fuera los demonios, ciertamente ha llegado a vosotros el reino de Dios.'),
    ('Se ofreció a Dios por el Espíritu eterno',
     'Cristo se ofreció a sí mismo como sacrificio mediante el Espíritu eterno.',
     'vida_jesus', 'Hebreos', 9, 14,
     'Cristo, el cual mediante el Espíritu eterno se ofreció a sí mismo sin mancha a Dios.'),
    ('Resucitó a Jesús de entre los muertos',
     'La resurrección de Cristo fue obra del Espíritu Santo.',
     'vida_jesus', 'Romanos', 8, 11,
     'El que levantó de los muertos a Cristo Jesús vivificará también vuestros cuerpos mortales.'),

    # ── EN PENTECOSTÉS ─────────────────────────────────────
    ('Fue prometido por Jesús antes de la ascensión',
     'Jesús prometió el bautismo del Espíritu Santo antes de su ascensión.',
     'pentecostes', 'Hechos', 1, 8,
     'Pero recibiréis poder, cuando haya venido sobre vosotros el Espíritu Santo.'),
    ('Descendió en Pentecostés',
     'El Espíritu Santo descendió en poder sobre los 120 discípulos en Pentecostés.',
     'pentecostes', 'Hechos', 2, 4,
     'Y fueron todos llenos del Espíritu Santo, y comenzaron a hablar en otras lenguas.'),
    ('Cumplió la profecía de Joel',
     'Pedro explicó que el derramamiento del Espíritu en Pentecostés era el cumplimiento de Joel 2:28.',
     'pentecostes', 'Hechos', 2, 16,
     'Mas esto es lo dicho por el profeta Joel.'),

    # ── EN LA IGLESIA ──────────────────────────────────────
    ('Guía a la iglesia en sus decisiones',
     'El Espíritu Santo dirigió las decisiones del concilio de Jerusalén.',
     'iglesia', 'Hechos', 15, 28,
     'Ha parecido bien al Espíritu Santo, y a nosotros.'),
    ('Llama y separa para el ministerio',
     'El Espíritu Santo llamó y separó a Pablo y Bernabé para la obra misionera.',
     'iglesia', 'Hechos', 13, 2,
     'Dijo el Espíritu Santo: Apartadme a Bernabé y a Saulo para la obra a que los he llamado.'),
    ('Distribuye los dones espirituales',
     'El Espíritu reparte a cada uno en particular como él quiere.',
     'iglesia', '1 Corintios', 12, 11,
     'Pero todas estas cosas las hace uno y el mismo Espíritu, repartiendo a cada uno en particular como él quiere.'),
    ('Intercede por los santos',
     'El Espíritu mismo intercede por nosotros con gemidos indecibles.',
     'iglesia', 'Romanos', 8, 26,
     'El Espíritu mismo intercede por nosotros con gemidos indecibles.'),
    ('Unifica el cuerpo de Cristo',
     'Hay un solo Espíritu que da unidad a todo el cuerpo de Cristo.',
     'iglesia', 'Efesios', 4, 4,
     'Un cuerpo, y un Espíritu, como fuisteis también llamados en una misma esperanza de vuestra vocación.'),

    # ── EN EL CREYENTE ─────────────────────────────────────
    ('Regenera al pecador',
     'El nuevo nacimiento es obra del Espíritu Santo.',
     'creyente', 'Juan', 3, 5,
     'El que no naciere de agua y del Espíritu, no puede entrar en el reino de Dios.'),
    ('Mora en el creyente',
     'El cuerpo del creyente es templo del Espíritu Santo.',
     'creyente', '1 Corintios', 6, 19,
     '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros?'),
    ('Sella al creyente',
     'El Espíritu es las arras de nuestra herencia hasta la redención.',
     'creyente', 'Efesios', 1, 13,
     'Fuisteis sellados con el Espíritu Santo de la promesa.'),
    ('Produce el fruto del Espíritu',
     'El Espíritu produce en el creyente el fruto que transforma su carácter.',
     'creyente', 'Gálatas', 5, 22,
     'Mas el fruto del Espíritu es: amor, gozo, paz, paciencia, benignidad, bondad, fe.'),
    ('Santifica progresivamente',
     'El Espíritu obra la santificación progresiva en el creyente.',
     'creyente', '2 Tesalonicenses', 2, 13,
     'Dios os haya escogido desde el principio para salvación, mediante la santificación por el Espíritu.'),
    ('Da testimonio de que somos hijos de Dios',
     'El Espíritu da testimonio interno de nuestra adopción como hijos.',
     'creyente', 'Romanos', 8, 16,
     'El Espíritu mismo da testimonio a nuestro espíritu, de que somos hijos de Dios.'),
    ('Guía en la oración',
     'El Espíritu ayuda en nuestra debilidad cuando no sabemos cómo orar.',
     'creyente', 'Romanos', 8, 26,
     'El Espíritu nos ayuda en nuestra debilidad; pues qué hemos de pedir como conviene, no lo sabemos.'),
    ('Ilumina las Escrituras',
     'El Espíritu Santo ilumina al creyente para entender las Escrituras.',
     'creyente', '1 Corintios', 2, 10,
     'Pero Dios nos las reveló a nosotros por el Espíritu; porque el Espíritu todo lo escudriña.'),
    ('Convence de pecado, justicia y juicio',
     'El Espíritu convence al mundo de pecado, de justicia y de juicio.',
     'creyente', 'Juan', 16, 8,
     'Y cuando él venga, convencerá al mundo de pecado, de justicia y de juicio.'),

    # ── EN EL TIEMPO DEL FIN ───────────────────────────────
    ('Derramamiento final sobre Israel',
     'En los últimos días Dios derramará su Espíritu sobre la casa de David.',
     'fin', 'Zacarías', 12, 10,
     'Derramaré sobre la casa de David, y sobre los moradores de Jerusalén, espíritu de gracia y de oración.'),
    ('Venida final del Espíritu con la novia',
     'En la consumación, el Espíritu y la Iglesia dicen juntos: Ven, Señor Jesús.',
     'fin', 'Apocalipsis', 22, 17,
     'Y el Espíritu y la Esposa dicen: Ven.'),
]

# Formato: (simbolo, significado, libro, cap, vers, contexto)
SIMBOLOS = [
    ('Paloma',
     'Símbolo de la mansedumbre, pureza e inocencia del Espíritu Santo. Su descenso sobre Jesús marcó el inicio de su ministerio público.',
     'Mateo', 3, 16,
     'Vio al Espíritu de Dios que descendía como paloma, y venía sobre él.'),
    ('Fuego',
     'Símbolo de la purificación, la presencia divina y el poder del Espíritu. Las lenguas de fuego en Pentecostés inauguraron la era del Espíritu.',
     'Hechos', 2, 3,
     'Y se les aparecieron lenguas repartidas, como de fuego, asentándose sobre cada uno de ellos.'),
    ('Viento',
     'El viento (pneuma en griego = viento/espíritu) es invisible pero sus efectos son evidentes. Símbolo de la soberanía y libertad del Espíritu.',
     'Juan', 3, 8,
     'El viento sopla de donde quiere, y oyes su sonido; mas ni sabes de dónde viene, ni a dónde va; así es todo aquel que es nacido del Espíritu.'),
    ('Agua',
     'Símbolo de la vida, purificación y abundancia espiritual. Jesús prometió ríos de agua viva como símbolo del Espíritu.',
     'Juan', 7, 38,
     'El que cree en mí, como dice la Escritura, de su interior correrán ríos de agua viva. Esto dijo del Espíritu.'),
    ('Aceite',
     'Símbolo de la unción del Espíritu para el ministerio, la sanidad y la consagración. Los reyes y sacerdotes eran ungidos con aceite.',
     '1 Juan', 2, 20,
     'Pero vosotros tenéis la unción del Santo, y conocéis todas las cosas.'),
    ('Sello',
     'Símbolo de propiedad, seguridad y autenticidad. El Espíritu sella al creyente como señal de que pertenece a Dios.',
     'Efesios', 1, 13,
     'En él también vosotros... fuisteis sellados con el Espíritu Santo de la promesa.'),
    ('Arras / Garantía',
     'El Espíritu es las arras (depósito inicial) de la herencia futura del creyente — garantía de la gloria venidera.',
     'Efesios', 1, 14,
     'Que es las arras de nuestra herencia hasta la redención de la posesión adquirida.'),
    ('Paloma (en Noé)',
     'La paloma que encontró tierra firme prefiguró al Espíritu que descansa sobre Cristo y los creyentes.',
     'Génesis', 8, 11,
     'Y la paloma volvió a él a la hora de la tarde; y he aquí que traía una hoja de olivo en el pico.'),
    ('Los siete espíritus (siete lámparas)',
     'Los siete espíritus ante el trono simbolizan la plenitud y perfección del Espíritu Santo.',
     'Apocalipsis', 4, 5,
     'Y del trono salían relámpagos y truenos y voces; y delante del trono ardían siete lámparas de fuego, las cuales son los siete espíritus de Dios.'),
    ('Nube y fuego en el desierto',
     'La columna de nube y fuego que guiaba a Israel prefiguraba al Espíritu guiando a la iglesia.',
     'Éxodo', 13, 21,
     'Jehová iba delante de ellos de día en una columna de nube... y de noche en una columna de fuego.'),
]

# Formato: (don, descripcion, categoria, libro, cap, vers)
# categorias: 'revelacion' | 'poder' | 'servicio' | 'liderazgo'
DONES = [
    # ── 1 CORINTIOS 12 ─────────────────────────────────────
    ('Palabra de sabiduría',
     'Capacidad sobrenatural de hablar con sabiduría divina aplicada a situaciones específicas.',
     'revelacion', '1 Corintios', 12, 8),
    ('Palabra de ciencia',
     'Conocimiento sobrenatural de hechos que no se pueden saber por medios naturales.',
     'revelacion', '1 Corintios', 12, 8),
    ('Fe',
     'Fe sobrenatural que va más allá de la fe salvadora — para mover montañas y creer lo imposible.',
     'poder', '1 Corintios', 12, 9),
    ('Dones de sanidades',
     'Capacidad sobrenatural para sanar enfermedades físicas en el nombre de Cristo.',
     'poder', '1 Corintios', 12, 9),
    ('Hacer milagros',
     'Capacidad de realizar obras de poder sobrenatural más allá de la sanidad.',
     'poder', '1 Corintios', 12, 10),
    ('Profecía',
     'Hablar en el nombre de Dios para edificación, exhortación y consolación de la iglesia.',
     'revelacion', '1 Corintios', 12, 10),
    ('Discernimiento de espíritus',
     'Capacidad de distinguir entre el Espíritu de Dios, el espíritu humano y espíritus demoníacos.',
     'revelacion', '1 Corintios', 12, 10),
    ('Géneros de lenguas',
     'Capacidad de hablar en un idioma no aprendido — señal para los incrédulos y edificación personal.',
     'poder', '1 Corintios', 12, 10),
    ('Interpretación de lenguas',
     'Capacidad de interpretar lo hablado en lenguas para que edifique a la congregación.',
     'revelacion', '1 Corintios', 12, 10),

    # ── ROMANOS 12 ─────────────────────────────────────────
    ('Profecía (Romanos)',
     'Proclamar la Palabra de Dios conforme a la medida de la fe.',
     'revelacion', 'Romanos', 12, 6),
    ('Servicio / Ministerio',
     'Don de servir a otros en las necesidades prácticas de la iglesia.',
     'servicio', 'Romanos', 12, 7),
    ('Enseñanza',
     'Capacidad de explicar y aplicar las verdades bíblicas de manera clara y edificante.',
     'revelacion', 'Romanos', 12, 7),
    ('Exhortación',
     'Don de animar, aconsejar y fortalecer a otros en su caminar cristiano.',
     'servicio', 'Romanos', 12, 8),
    ('Repartir / Dar',
     'Don de dar generosamente de los recursos propios para las necesidades del reino.',
     'servicio', 'Romanos', 12, 8),
    ('Presidir / Liderazgo',
     'Capacidad de gobernar y administrar con diligencia en la iglesia.',
     'liderazgo', 'Romanos', 12, 8),
    ('Misericordia',
     'Don de mostrar compasión práctica a los que sufren con gozo y constancia.',
     'servicio', 'Romanos', 12, 8),

    # ── EFESIOS 4 ──────────────────────────────────────────
    ('Apóstoles',
     'Enviados con autoridad especial para fundar iglesias y establecer la doctrina — don fundacional.',
     'liderazgo', 'Efesios', 4, 11),
    ('Profetas',
     'Portavoces de Dios que edifican, exhortan y consuelan a la iglesia.',
     'liderazgo', 'Efesios', 4, 11),
    ('Evangelistas',
     'Predicadores del evangelio con capacidad especial de llevar almas a Cristo.',
     'liderazgo', 'Efesios', 4, 11),
    ('Pastores y maestros',
     'Don combinado de apacentar y enseñar al rebaño de Dios con cuidado y verdad.',
     'liderazgo', 'Efesios', 4, 11),

    # ── 1 PEDRO 4 ──────────────────────────────────────────
    ('Hablar la Palabra',
     'Hablar como quien expresa las palabras de Dios — el don de proclamación.',
     'revelacion', '1 Pedro', 4, 11),
    ('Servir',
     'Ministrar con la fortaleza que Dios provee — el don de servicio sobrenatural.',
     'servicio', '1 Pedro', 4, 11),
]

# Formato: (fruto, descripcion, libro, cap, vers)
FRUTOS = [
    ('Amor',        'Ἀγάπη (Agape) — amor incondicional, sacrificial, que no busca lo suyo. Es el primero y mayor fruto.',    'Gálatas', 5, 22),
    ('Gozo',        'Χαρά (Chara) — alegría profunda que no depende de las circunstancias, sino de la presencia de Dios.', 'Gálatas', 5, 22),
    ('Paz',         'Εἰρήνη (Eirene) — shalom: bienestar completo, armonía con Dios y los hombres, tranquilidad interior.', 'Gálatas', 5, 22),
    ('Paciencia',   'Μακροθυμία (Makrothumia) — longanimidad, soportar las pruebas y a las personas difíciles sin rendirse.', 'Gálatas', 5, 22),
    ('Benignidad',  'Χρηστότης (Chrestotes) — bondad práctica que se manifiesta en actos de gentileza y utilidad hacia otros.', 'Gálatas', 5, 22),
    ('Bondad',      'Ἀγαθωσύνη (Agathosune) — rectitud moral activa que busca hacer el bien aunque implique corrección.', 'Gálatas', 5, 22),
    ('Fe',          'Πίστις (Pistis) — fidelidad, lealtad y confiabilidad en las relaciones y los compromisos.', 'Gálatas', 5, 22),
    ('Mansedumbre', 'Πραΰτης (Prautes) — fortaleza bajo control, humildad, docilidad ante Dios y los hombres.', 'Gálatas', 5, 23),
    ('Templanza',   'Ἐγκράτεια (Egkrateia) — dominio propio, autocontrol en los deseos, emociones y apetitos.', 'Gálatas', 5, 23),
]

# Presencia del Espíritu por libro
# Formato: (libro, total_menciones, resumen, libro_ref, cap, vers)
POR_LIBRO = [
    ('Génesis',    5,  'El Espíritu aparece en la creación (1:2), da vida al hombre (2:7), limita el tiempo humano (6:3) y es reconocido por Faraón en José (41:38).', 'Génesis', 1, 2),
    ('Éxodo',      4,  'El Espíritu equipa a Bezaleel y Aholiab para construir el tabernáculo con sabiduría divina.', 'Éxodo', 31, 3),
    ('Números',    3,  'El Espíritu reposa sobre los 70 ancianos de Israel y sobre Josué para el liderazgo.', 'Números', 11, 25),
    ('Jueces',    10,  'El Espíritu viene con poder sobre los jueces: Otoniel, Gedeón, Jefté, Sansón para liberar a Israel.', 'Jueces', 3, 10),
    ('1 Samuel',   8,  'El Espíritu viene sobre Saúl y David al ser ungidos como reyes; se aparta de Saúl.', '1 Samuel', 16, 13),
    ('2 Samuel',   2,  'El Espíritu habló por David en sus últimas palabras.', '2 Samuel', 23, 2),
    ('1 Reyes',    3,  'El Espíritu arrebata a Elías; los profetas de Jericó buscan al profeta llevado por el Espíritu.', '1 Reyes', 18, 12),
    ('2 Reyes',    2,  'Eliseo pide doble porción del espíritu de Elías.', '2 Reyes', 2, 9),
    ('Nehemías',   2,  'El Espíritu instruyó al pueblo a través de Moisés en el desierto.', 'Nehemías', 9, 20),
    ('Job',        3,  'El espíritu de Dios dio vida a Job; Eliú reconoce que el Espíritu le da entendimiento.', 'Job', 33, 4),
    ('Salmos',     8,  'David ora por no perder el Espíritu Santo (51:11); el Espíritu de Dios está en todas partes (139:7).', 'Salmos', 51, 11),
    ('Isaías',    25,  'El libro más rico en promesas del Espíritu: el siervo ungido (42:1), el Renuevo (11:2), el derramamiento prometido (44:3), la unción mesiánica (61:1).', 'Isaías', 61, 1),
    ('Ezequiel',  20,  'El Espíritu levanta, transporta y habla a Ezequiel constantemente. Promete poner el Espíritu en el Israel restaurado (36:27; 37:14).', 'Ezequiel', 36, 27),
    ('Joel',       2,  'Profecía central del AT sobre el derramamiento del Espíritu sobre toda carne cumplida en Pentecostés.', 'Joel', 2, 28),
    ('Zacarías',   4,  'No con ejército ni con fuerza, sino con el Espíritu de Jehová (4:6). Promesa del Espíritu de gracia en el fin.', 'Zacarías', 4, 6),
    ('Mateo',     12,  'El Espíritu concibe a Jesús, desciende en el bautismo, lleva a la tentación. Jesús expulsa demonios por el Espíritu. La blasfemia imperdonable es contra el Espíritu.', 'Mateo', 3, 16),
    ('Marcos',     6,  'El Espíritu desciende sobre Jesús, lo impulsa al desierto. Promete que el Espíritu hablará por los perseguidos.', 'Marcos', 1, 10),
    ('Lucas',     17,  'El evangelio del Espíritu: Juan es lleno desde el vientre, María concibe por el Espíritu, Jesús lleno del Espíritu, el programa del Espíritu en la misión.', 'Lucas', 4, 1),
    ('Juan',      15,  'La enseñanza más completa sobre el Consolador (caps. 14-16): viene del Padre, enseña, guía, convence, glorifica a Cristo.', 'Juan', 14, 16),
    ('Hechos',    55,  'El libro del Espíritu Santo: Pentecostés, la iglesia guiada por el Espíritu, los misioneros enviados por el Espíritu. Mencionado ~55 veces.', 'Hechos', 2, 4),
    ('Romanos',   20,  'La doctrina del Espíritu más completa del NT: vida en el Espíritu (cap. 8), frente a la carne; los dones; la intercesión del Espíritu.', 'Romanos', 8, 26),
    ('1 Corintios',18, 'Los dones del Espíritu y su uso correcto en la iglesia. El cuerpo como templo del Espíritu. El amor como el camino más excelente.', '1 Corintios', 12, 1),
    ('2 Corintios', 8, 'El ministerio del Espíritu supera la gloria de Moisés. El Espíritu es las arras de la gloria futura.', '2 Corintios', 3, 6),
    ('Gálatas',    7,  'Andar en el Espíritu vs. las obras de la carne. El fruto del Espíritu. Los que son de Cristo han crucificado la carne.', 'Gálatas', 5, 16),
    ('Efesios',   10,  'Sellados con el Espíritu, no contristéis al Espíritu, sed llenos del Espíritu. La unidad del Espíritu. La espada del Espíritu.', 'Efesios', 1, 13),
    ('1 Tesalonicenses', 3, 'No apaguéis al Espíritu. La santificación es obra del Espíritu.', '1 Tesalonicenses', 5, 19),
    ('2 Timoteo',  2,  'El Espíritu que Dios nos ha dado no es de cobardía sino de poder, amor y dominio propio.', '2 Timoteo', 1, 7),
    ('Hebreos',    8,  'El Espíritu da testimonio de la nueva alianza. El Espíritu eterno en el sacrificio de Cristo. No despreciar al Espíritu de gracia.', 'Hebreos', 9, 14),
    ('1 Pedro',    4,  'El Espíritu de gloria y de Dios reposa sobre los que padecen. El Espíritu que inspiró a los profetas.', '1 Pedro', 4, 14),
    ('2 Pedro',    2,  'Los profetas fueron inspirados por el Espíritu Santo — la doctrina de la inspiración bíblica.', '2 Pedro', 1, 21),
    ('1 Juan',     5,  'El Espíritu que está en nosotros es mayor que el que está en el mundo. La unción del Santo enseña todas las cosas.', '1 Juan', 4, 4),
    ('Judas',      2,  'Edificándoos en la fe, orando en el Espíritu Santo.', 'Judas', 1, 20),
    ('Apocalipsis',20, 'Juan está en el Espíritu en el día del Señor. Los siete espíritus. El Espíritu habla a las iglesias. El Espíritu y la Esposa dicen: Ven.', 'Apocalipsis', 1, 10),
]

# ══════════════════════════════════════════════════════════════
# FUNCIONES
# ══════════════════════════════════════════════════════════════
def get_vid(cur, libro, cap, vers):
    cur.execute("""
        SELECT v.id FROM versiculos v
        JOIN capitulos c ON v.capitulo_id = c.id
        JOIN libros l    ON v.libro_id    = l.id
        WHERE l.nombre = %s AND c.numero = %s AND v.numero = %s
    """, (libro, cap, vers))
    row = cur.fetchone()
    return row[0] if row else None

def cargar_neumatologia(cur):
    print("\n🕊️   Cargando neumatología completa...")

    # Nombres
    print("   → Nombres y títulos del Espíritu...")
    cur.execute("TRUNCATE TABLE espiritusanto_nombres RESTART IDENTITY CASCADE")
    rows = []
    for n in NOMBRES:
        vid = get_vid(cur, n[2], n[3], n[4])
        rows.append((n[0], n[1], n[2], n[3], n[4], n[5], n[6], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_nombres (nombre, hebreo_griego, libro, capitulo, versiculo, contexto, categoria, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} nombres")

    # Obras
    print("   → Obras del Espíritu...")
    cur.execute("TRUNCATE TABLE espiritusanto_obras RESTART IDENTITY CASCADE")
    rows = []
    for o in OBRAS:
        vid = get_vid(cur, o[3], o[4], o[5])
        rows.append((o[0], o[1], o[2], o[3], o[4], o[5], o[6], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_obras (obra, descripcion, etapa, libro, capitulo, versiculo, texto_clave, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} obras")

    # Símbolos
    print("   → Símbolos del Espíritu...")
    cur.execute("TRUNCATE TABLE espiritusanto_simbolos RESTART IDENTITY CASCADE")
    rows = []
    for s in SIMBOLOS:
        vid = get_vid(cur, s[2], s[3], s[4])
        rows.append((s[0], s[1], s[2], s[3], s[4], s[5], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_simbolos (simbolo, significado, libro, capitulo, versiculo, contexto, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} símbolos")

    # Dones
    print("   → Dones del Espíritu...")
    cur.execute("TRUNCATE TABLE espiritusanto_dones RESTART IDENTITY CASCADE")
    rows = []
    for d in DONES:
        vid = get_vid(cur, d[3], d[4], d[5])
        rows.append((d[0], d[1], d[2], d[3], d[4], d[5], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_dones (don, descripcion, categoria, libro, capitulo, versiculo, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} dones")

    # Fruto
    print("   → Fruto del Espíritu...")
    cur.execute("TRUNCATE TABLE espiritusanto_fruto RESTART IDENTITY CASCADE")
    rows = []
    for f in FRUTOS:
        vid = get_vid(cur, f[2], f[3], f[4])
        rows.append((f[0], f[1], f[2], f[3], f[4], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_fruto (fruto, descripcion, libro, capitulo, versiculo, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} frutos")

    # Por libro
    print("   → Presencia por libro...")
    cur.execute("TRUNCATE TABLE espiritusanto_por_libro RESTART IDENTITY CASCADE")
    rows = []
    for p in POR_LIBRO:
        vid = get_vid(cur, p[3], p[4], p[5])
        rows.append((p[0], p[1], p[2], p[3], p[4], p[5], vid))
    execute_values(cur, """
        INSERT INTO espiritusanto_por_libro (libro, total_menciones, resumen, versiculo_clave_libro, versiculo_clave_cap, versiculo_clave_vers, versiculo_id)
        VALUES %s
    """, rows)
    print(f"     ✅ {len(rows)} libros")

    total = len(NOMBRES) + len(OBRAS) + len(SIMBOLOS) + len(DONES) + len(FRUTOS) + len(POR_LIBRO)
    print(f"\n  🎉  {total} entradas de neumatología cargadas")

if __name__ == '__main__':
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    print("📋  Creando tablas...")
    cur.execute(SQL_TABLAS)
    conn.commit()
    print("  ✅  Tablas creadas")
    cargar_neumatologia(cur)
    conn.commit()
    cur.close()
    conn.close()
    print("\n✅  Neumatología lista en Neon.")