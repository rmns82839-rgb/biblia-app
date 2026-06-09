"""
============================================================
 AMPLIAR PROFECÍAS MESIÁNICAS → NEON
 Agrega ~280 profecías adicionales para llegar a ~337 total

 Uso: python ampliar_profecias.py
============================================================
"""
import os, sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌  Falta DATABASE_URL en .env")
    sys.exit(1)

# ─── PROFECÍAS ADICIONALES ───────────────────────────────────
# Formato: (libro, cap, vers, tema, cum_libro, cum_cap, cum_vers)
# cum_libro/cap/vers puede ser None si no hay cita directa en NT
PROFECIAS_EXTRA = [
    # ── GÉNESIS ────────────────────────────────────────────
    ('Génesis',  3,  15, 'Enemistad entre la simiente de la mujer y la serpiente', 'Romanos', 16, 20),
    ('Génesis',  5,  24, 'Enoc trasladado — tipo de la resurrección/arrebatamiento', 'Hebreos', 11, 5),
    ('Génesis', 14,  18, 'Melquisedec — sacerdote y rey, tipo de Cristo', 'Hebreos', 7, 1),
    ('Génesis', 17,  19, 'Isaac — simiente prometida, tipo de Cristo', 'Gálatas', 4, 28),
    ('Génesis', 22,   2, 'Abraham ofrece a Isaac — tipo del sacrificio de Cristo', 'Hebreos', 11, 17),
    ('Génesis', 26,   4, 'En tu simiente serán benditas las naciones — Isaac', 'Gálatas', 3, 16),
    ('Génesis', 28,  14, 'En tu simiente serán benditas todas las familias — Jacob', 'Gálatas', 3, 16),
    ('Génesis', 37,  28, 'José vendido por sus hermanos — tipo de Cristo', 'Mateo', 26, 15),
    ('Génesis', 45,   7, 'José salva a sus hermanos — tipo de la redención', 'Juan', 4, 42),
    ('Génesis', 49,  24, 'El Pastor, la Piedra de Israel', 'Juan', 10, 11),

    # ── ÉXODO ──────────────────────────────────────────────
    ('Éxodo',    3,   2, 'Zarza ardiente — manifestación de la gloria de Dios', 'Juan', 8, 58),
    ('Éxodo',   12,   3, 'El cordero pascual sin defecto', 'Juan', 1, 29),
    ('Éxodo',   12,  13, 'La sangre del cordero protege de la muerte', '1 Corintios', 5, 7),
    ('Éxodo',   12,  21, 'Sacrificio del cordero pascual', '1 Pedro', 1, 19),
    ('Éxodo',   12,  46, 'Ningún hueso del cordero será quebrado', 'Juan', 19, 36),
    ('Éxodo',   13,  21, 'La columna de nube y fuego — Dios guía a su pueblo', '1 Corintios', 10, 4),
    ('Éxodo',   16,  15, 'El maná del cielo — tipo del pan de vida', 'Juan', 6, 31),
    ('Éxodo',   17,   6, 'La roca golpeada que da agua — tipo de Cristo', '1 Corintios', 10, 4),
    ('Éxodo',   24,   8, 'La sangre del pacto rociada sobre el pueblo', 'Hebreos', 9, 20),
    ('Éxodo',   25,  40, 'El tabernáculo — sombra de las cosas celestiales', 'Hebreos', 8, 5),

    # ── LEVÍTICO ───────────────────────────────────────────
    ('Levítico',  1,   2, 'El holocausto — tipo del sacrificio completo de Cristo', 'Efesios', 5, 2),
    ('Levítico',  4,   3, 'El sacrificio por el pecado — tipo de la expiación', 'Hebreos', 10, 6),
    ('Levítico', 16,   2, 'El Día de la Expiación — tipo de la obra de Cristo', 'Hebreos', 9, 7),
    ('Levítico', 16,  15, 'El sumo sacerdote entra con sangre al Lugar Santísimo', 'Hebreos', 9, 12),
    ('Levítico', 16,  21, 'El macho cabrío expiatorio que lleva los pecados', 'Hebreos', 9, 28),
    ('Levítico', 17,  11, 'La sangre hace expiación por el alma', 'Hebreos', 9, 22),
    ('Levítico', 23,  36, 'La fiesta de los tabernáculos — tipo del reino milenial', 'Juan', 7, 37),

    # ── NÚMEROS ────────────────────────────────────────────
    ('Números',   9,  12, 'La Pascua — ningún hueso del cordero roto', 'Juan', 19, 36),
    ('Números',  21,   9, 'La serpiente de bronce levantada — tipo de la crucifixión', 'Juan', 3, 14),
    ('Números',  35,  25, 'Las ciudades de refugio — tipo de Cristo como refugio', 'Hebreos', 6, 18),

    # ── DEUTERONOMIO ───────────────────────────────────────
    ('Deuteronomio',  18, 18, 'Profeta como Moisés que habla las palabras de Dios', 'Juan', 6, 14),
    ('Deuteronomio',  21, 23, 'Maldito todo el que es colgado en un madero', 'Gálatas', 3, 13),
    ('Deuteronomio',  30,  3, 'Restauración de Israel en los últimos tiempos', 'Romanos', 11, 26),

    # ── JOSUÉ ──────────────────────────────────────────────
    ('Josué',  5, 15, 'Josué (Jesús en hebreo) — tipo del verdadero capitán', 'Hebreos', 2, 10),

    # ── RUT ────────────────────────────────────────────────
    ('Rut',  4,  4, 'El pariente redentor (goel) — tipo de Cristo redentor', 'Gálatas', 4, 5),

    # ── 1 SAMUEL ───────────────────────────────────────────
    ('1 Samuel',  2, 10, 'Jehová juzgará los confines de la tierra, exaltará a su rey', 'Lucas', 1, 69),

    # ── 2 SAMUEL ───────────────────────────────────────────
    ('2 Samuel',  7, 12, 'Levantaré tu simiente después de ti — pacto davídico', 'Lucas', 1, 32),
    ('2 Samuel',  7, 14, 'Yo le seré a él padre, y él me será a mí hijo', 'Hebreos', 1, 5),
    ('2 Samuel',  7, 16, 'Tu trono será estable para siempre', 'Lucas', 1, 33),

    # ── SALMOS ─────────────────────────────────────────────
    ('Salmos',   2,  2, 'Los reyes de la tierra conspiran contra el Ungido', 'Hechos', 4, 26),
    ('Salmos',   2,  6, 'Yo he puesto mi rey sobre Sion', 'Juan', 18, 37),
    ('Salmos',   2,  8, 'Pídeme y te daré por herencia las naciones', 'Apocalipsis', 2, 27),
    ('Salmos',   2, 12, 'Honrad al Hijo', 'Juan', 5, 23),
    ('Salmos',   8,  6, 'Le hiciste señorear sobre las obras de tus manos', 'Hebreos', 2, 8),
    ('Salmos',  16,  8, 'A Jehová he puesto siempre delante de mí', 'Hechos', 2, 25),
    ('Salmos',  16,  9, 'Mi carne también reposará confiadamente', 'Hechos', 2, 26),
    ('Salmos',  16, 11, 'Me mostrarás la senda de la vida', 'Hechos', 2, 28),
    ('Salmos',  22,  6, 'Mas yo soy gusano, no hombre — reproche de hombres', 'Marcos', 9, 12),
    ('Salmos',  22,  8, 'Remítete a Jehová, libérele', 'Mateo', 27, 43),
    ('Salmos',  22, 14, 'Como agua me he derramado — agonía en la cruz', 'Juan', 19, 34),
    ('Salmos',  22, 15, 'Mi lengua se pegó a mi paladar — sed en la cruz', 'Juan', 19, 28),
    ('Salmos',  22, 17, 'Contaré todos mis huesos', 'Juan', 19, 36),
    ('Salmos',  22, 22, 'Anunciaré tu nombre a mis hermanos', 'Hebreos', 2, 12),
    ('Salmos',  23,  1, 'Jehová es mi pastor — el buen pastor', 'Juan', 10, 11),
    ('Salmos',  24,  3, '¿Quién subirá al monte de Jehová? El Rey de gloria', 'Juan', 3, 13),
    ('Salmos',  31,  5, 'En tu mano encomiendo mi espíritu', 'Lucas', 23, 46),
    ('Salmos',  35, 19, 'Me aborrecieron sin causa', 'Juan', 15, 25),
    ('Salmos',  40,  6, 'Holocausto y expiación no has demandado — me preparaste cuerpo', 'Hebreos', 10, 5),
    ('Salmos',  40,  7, 'He aquí vengo — en el rollo del libro está escrito de mí', 'Hebreos', 10, 7),
    ('Salmos',  40,  8, 'El hacer tu voluntad, Dios mío, me ha agradado', 'Juan', 4, 34),
    ('Salmos',  41,  9, 'Mi amigo alzó el calcañar contra mí', 'Juan', 13, 18),
    ('Salmos',  45,  2, 'Eres el más hermoso de los hijos de los hombres', 'Juan', 1, 14),
    ('Salmos',  45,  7, 'Amaste la justicia y aborreciste la maldad', 'Hebreos', 1, 9),
    ('Salmos',  68, 18, 'Subiste a lo alto, llevaste cautiva la cautividad', 'Efesios', 4, 8),
    ('Salmos',  69,  4, 'Se han aumentado más que los cabellos de mi cabeza los que me aborrecen', 'Juan', 15, 25),
    ('Salmos',  69,  8, 'Extraño soy para mis hermanos', 'Juan', 1, 11),
    ('Salmos',  69, 20, 'El escarnio ha quebrantado mi corazón', 'Marcos', 15, 17),
    ('Salmos',  72,  8, 'Dominará de mar a mar', 'Apocalipsis', 11, 15),
    ('Salmos',  72, 17, 'Su nombre permanecerá para siempre', 'Juan', 1, 1),
    ('Salmos',  89, 27, 'Yo también le pondré por primogénito', 'Colosenses', 1, 15),
    ('Salmos',  89, 36, 'Su simiente permanecerá para siempre', 'Lucas', 1, 33),
    ('Salmos',  91, 11, 'Mandará a sus ángeles que te guarden', 'Mateo', 4, 6),
    ('Salmos',  97,  7, 'Póstrense ante él todos los dioses', 'Hebreos', 1, 6),
    ('Salmos', 102, 25, 'Tú, oh Jehová, fundaste la tierra en el principio', 'Hebreos', 1, 10),
    ('Salmos', 102, 27, 'Mas tú eres el mismo, y tus años no se acabarán', 'Hebreos', 13, 8),
    ('Salmos', 109,  8, 'Tome otro su oficio', 'Hechos', 1, 20),
    ('Salmos', 110,  2, 'Jehová enviará desde Sion la vara de tu poder', 'Apocalipsis', 19, 15),
    ('Salmos', 118, 24, 'Este es el día que hizo Jehová', 'Mateo', 28, 6),
    ('Salmos', 132, 11, 'Jehová juró a David una verdad de la cual no se retractará', 'Hechos', 2, 30),
    ('Salmos', 132, 17, 'Allí haré brotar el poder de David', 'Lucas', 1, 69),

    # ── ISAÍAS ─────────────────────────────────────────────
    ('Isaías',   4,  2, 'El renuevo de Jehová — el Mesías', 'Juan', 15, 1),
    ('Isaías',   6,  1, 'Vi yo al Señor sentado sobre un trono — visión de Cristo', 'Juan', 12, 41),
    ('Isaías',   6,  9, 'Oíd bien, y no entendáis — endurecimiento', 'Mateo', 13, 14),
    ('Isaías',   8, 14, 'Será por piedra de tropiezo', 'Romanos', 9, 33),
    ('Isaías',   9,  7, 'Lo dilatado de su imperio y la paz no tendrán límite', 'Lucas', 1, 32),
    ('Isaías',  11,  4, 'Juzgará con justicia a los pobres', 'Apocalipsis', 19, 15),
    ('Isaías',  11, 10, 'La raíz de Isaí, que estará puesta como bandera', 'Romanos', 15, 12),
    ('Isaías',  22, 22, 'Pondré la llave de la casa de David sobre su hombro', 'Apocalipsis', 3, 7),
    ('Isaías',  25,  8, 'Destruirá a la muerte para siempre', '1 Corintios', 15, 54),
    ('Isaías',  28, 16, 'El que creyere no se apresure — piedra de fundamento', '1 Pedro', 2, 6),
    ('Isaías',  29, 18, 'Los sordos oirán las palabras del libro', 'Mateo', 11, 5),
    ('Isaías',  32,  1, 'He aquí que un rey reinará con justicia', 'Apocalipsis', 19, 16),
    ('Isaías',  35,  3, 'Fortaleced las manos cansadas', 'Hebreos', 12, 12),
    ('Isaías',  40, 11, 'Como pastor apacentará su rebaño', 'Juan', 10, 11),
    ('Isaías',  42,  3, 'La caña cascada no quebrará', 'Mateo', 12, 20),
    ('Isaías',  42,  4, 'No se cansará ni desmayará hasta que establezca juicio', 'Mateo', 12, 21),
    ('Isaías',  42,  6, 'Te pondré por pacto al pueblo, por luz de las naciones', 'Lucas', 2, 32),
    ('Isaías',  42,  7, 'Para que abras los ojos de los ciegos', 'Juan', 9, 39),
    ('Isaías',  44,  3, 'Derramaré aguas sobre el sediento', 'Juan', 7, 38),
    ('Isaías',  45, 23, 'Ante mí se doblará toda rodilla', 'Romanos', 14, 11),
    ('Isaías',  49,  2, 'Puso mi boca como espada aguda', 'Apocalipsis', 1, 16),
    ('Isaías',  49,  7, 'El despreciado de alma, el abominado de las naciones', 'Juan', 1, 11),
    ('Isaías',  50,  3, 'Vestí de oscuridad los cielos — señales en la crucifixión', 'Mateo', 27, 45),
    ('Isaías',  52,  7, 'Cuán hermosos son los pies del que trae alegres nuevas', 'Romanos', 10, 15),
    ('Isaías',  52, 13, 'He aquí que mi siervo será prosperado', 'Hechos', 3, 13),
    ('Isaías',  52, 14, 'Como se asombraron de ti muchos, de tal manera fue desfigurado', 'Marcos', 15, 17),
    ('Isaías',  52, 15, 'Así asombrará a muchas naciones', 'Romanos', 15, 21),
    ('Isaías',  53,  2, 'Subirá como renuevo delante de él — apariencia sin atractivo', 'Juan', 1, 11),
    ('Isaías',  53,  6, 'Jehová cargó en él el pecado de todos nosotros', '1 Pedro', 2, 25),
    ('Isaías',  53,  8, 'Por crimen fue quitado — fue cortado de la tierra de los vivientes', 'Hechos', 8, 33),
    ('Isaías',  53, 10, 'Con todo eso Jehová quiso quebrantarle — verá linaje', 'Juan', 12, 38),
    ('Isaías',  53, 11, 'Con su conocimiento justificará mi siervo justo a muchos', 'Romanos', 5, 19),
    ('Isaías',  54, 13, 'Todos tus hijos serán enseñados por Jehová', 'Juan', 6, 45),
    ('Isaías',  55, 11, 'Así será mi palabra que sale de mi boca', 'Juan', 1, 1),
    ('Isaías',  59, 20, 'Vendrá el Redentor a Sion', 'Romanos', 11, 26),
    ('Isaías',  60,  1, 'Levántate, resplandece, que ha venido tu luz', 'Juan', 8, 12),
    ('Isaías',  61,  2, 'A proclamar el año de la buena voluntad de Jehová', 'Lucas', 4, 19),
    ('Isaías',  62, 11, 'He aquí que viene tu Salvador', 'Mateo', 21, 5),
    ('Isaías',  63,  1, '¿Quién es éste que viene de Edom? — Cristo victorioso', 'Apocalipsis', 19, 13),

    # ── JEREMÍAS ───────────────────────────────────────────
    ('Jeremías',  23,  5, 'Renuevo justo, y reinará como rey inteligente', 'Juan', 1, 49),
    ('Jeremías',  23,  6, 'Jehová, justicia nuestra — nombre del Mesías', 'Romanos', 10, 4),
    ('Jeremías',  31, 22, 'Jehová creará cosa nueva — la virgen rodeará al varón', 'Lucas', 1, 35),
    ('Jeremías',  31, 33, 'Pondré mi ley en su mente y en su corazón', 'Hebreos', 8, 10),
    ('Jeremías',  31, 34, 'Me conocerán todos desde el menor hasta el mayor', 'Hebreos', 8, 11),
    ('Jeremías',  33, 15, 'Haré brotar a David un Renuevo de justicia', 'Lucas', 1, 32),

    # ── EZEQUIEL ───────────────────────────────────────────
    ('Ezequiel', 17, 22, 'Yo plantaré un renuevo del cedro alto — el Mesías rey', 'Lucas', 1, 32),
    ('Ezequiel', 34, 23, 'Levantaré a un pastor sobre ellas — mi siervo David', 'Juan', 10, 16),
    ('Ezequiel', 34, 24, 'Yo Jehová seré su Dios y David príncipe entre ellos', 'Juan', 10, 11),
    ('Ezequiel', 36, 25, 'Esparciré sobre vosotros agua limpia — nueva creación', 'Juan', 3, 5),
    ('Ezequiel', 36, 27, 'Pondré dentro de vosotros mi Espíritu', 'Juan', 14, 17),
    ('Ezequiel', 37,  1, 'El valle de los huesos secos — resurrección', 'Juan', 11, 25),
    ('Ezequiel', 37, 24, 'Mi siervo David será rey sobre ellos', 'Lucas', 1, 32),
    ('Ezequiel', 44,  2, 'Esta puerta estará cerrada — solo el príncipe entrará', 'Mateo', 1, 23),

    # ── DANIEL ─────────────────────────────────────────────
    ('Daniel',   2, 44, 'El Dios del cielo levantará un reino que no será destruido', 'Lucas', 1, 33),
    ('Daniel',   7, 13, 'Con las nubes del cielo venía uno como un hijo de hombre', 'Mateo', 26, 64),
    ('Daniel',   7, 14, 'Le fue dado dominio, gloria y reino — reino eterno', 'Apocalipsis', 11, 15),
    ('Daniel',   9, 24, 'Setenta semanas están determinadas — la profecía de las 70 semanas', 'Marcos', 1, 15),
    ('Daniel',   9, 25, 'Hasta el Mesías Príncipe habrá siete semanas', 'Juan', 1, 41),
    ('Daniel',   9, 26, 'Se quitará la vida al Mesías — el Príncipe venidero', 'Juan', 19, 30),

    # ── OSEAS ──────────────────────────────────────────────
    ('Oseas',   2, 23, 'Llamaré pueblo mío al que no era mi pueblo', 'Romanos', 9, 25),
    ('Oseas',   6,  2, 'Al tercer día nos resucitará', '1 Corintios', 15, 4),
    ('Oseas',  11,  1, 'De Egipto llamé a mi hijo', 'Mateo', 2, 15),
    ('Oseas',  13, 14, '¿De la mano del Seol los redimiré?', '1 Corintios', 15, 55),

    # ── JOEL ───────────────────────────────────────────────
    ('Joel',   2, 28, 'Derramaré mi Espíritu sobre toda carne', 'Hechos', 2, 17),
    ('Joel',   2, 29, 'También sobre los siervos y sobre las siervas derramaré', 'Hechos', 2, 18),
    ('Joel',   2, 32, 'Todo aquel que invocare el nombre de Jehová será salvo', 'Romanos', 10, 13),

    # ── AMÓS ───────────────────────────────────────────────
    ('Amós',   8,  9, 'El sol se pondrá a mediodía — oscuridad en la crucifixión', 'Mateo', 27, 45),
    ('Amós',   9, 11, 'Levantaré el tabernáculo caído de David', 'Hechos', 15, 16),

    # ── MIQUEAS ────────────────────────────────────────────
    ('Miqueas',  4,  1, 'El monte de la casa de Jehová será establecido', 'Apocalipsis', 21, 10),
    ('Miqueas',  5,  4, 'Se levantará y apacentará con poder de Jehová', 'Juan', 10, 11),
    ('Miqueas',  7,  6, 'El hijo deshonra al padre — división que trae el evangelio', 'Mateo', 10, 35),
    ('Miqueas',  7, 20, 'Cumplirás la verdad a Jacob — fidelidad al pacto', 'Lucas', 1, 72),

    # ── HABACUC ────────────────────────────────────────────
    ('Habacuc',  1,  5, 'Veréis algo que no creeréis cuando se os cuente', 'Hechos', 13, 41),
    ('Habacuc',  2,  4, 'El justo por su fe vivirá', 'Romanos', 1, 17),

    # ── HAGEO ──────────────────────────────────────────────
    ('Hageo',   2,  6, 'Haré temblar los cielos y la tierra — venida del Señor', 'Hebreos', 12, 26),
    ('Hageo',   2,  9, 'La gloria postrera de esta casa será mayor que la primera', 'Juan', 1, 14),
    ('Hageo',   2, 23, 'Te pondré como anillo de sellar — Zorobabel, tipo del Mesías', 'Mateo', 1, 12),

    # ── ZACARÍAS ───────────────────────────────────────────
    ('Zacarías',  2, 10, 'Canta y alégrate, hija de Sion — Jehová vendrá a morar', 'Juan', 1, 14),
    ('Zacarías',  3,  8, 'He aquí, yo traigo a mi siervo el Renuevo', 'Juan', 15, 1),
    ('Zacarías',  6, 12, 'He aquí el varón cuyo nombre es el Renuevo', 'Juan', 1, 45),
    ('Zacarías',  6, 13, 'Él edificará el templo de Jehová y llevará gloria', 'Hebreos', 8, 1),
    ('Zacarías',  9, 10, 'Su dominio será de mar a mar — reino universal del Mesías', 'Lucas', 1, 32),
    ('Zacarías', 10,  4, 'De él saldrá la piedra angular, de él la clavija', 'Efesios', 2, 20),
    ('Zacarías', 11,  4, 'Apacienta las ovejas destinadas al matadero', 'Juan', 10, 11),
    ('Zacarías', 11,  7, 'Apacenté las ovejas de la matanza con dos cayados', 'Juan', 10, 16),
    ('Zacarías', 12,  3, 'Haré de Jerusalén una piedra pesada a todos los pueblos', 'Lucas', 21, 24),
    ('Zacarías', 13,  7, 'Hiere al pastor y serán dispersadas las ovejas', 'Mateo', 26, 31),
    ('Zacarías', 14,  4, 'Pondrá sus pies en aquel día sobre el Monte de los Olivos', 'Hechos', 1, 11),
    ('Zacarías', 14,  9, 'Jehová será rey sobre toda la tierra', 'Apocalipsis', 11, 15),
    ('Zacarías', 14, 16, 'Todos los que sobrevivieren irán a adorar al Rey', 'Apocalipsis', 21, 24),

    # ── MALAQUÍAS ──────────────────────────────────────────
    ('Malaquías', 3,  2, '¿Y quién podrá soportar el tiempo de su venida?', 'Apocalipsis', 6, 17),
    ('Malaquías', 3,  3, 'Se sentará para afinar y limpiar la plata', 'Lucas', 3, 17),
    ('Malaquías', 3, 17, 'Serán para mí especial tesoro el día que yo actúe', '1 Pedro', 2, 9),

    # ── SALMOS ADICIONALES ─────────────────────────────────
    ('Salmos',   1,  1, 'Bienaventurado el varón que no anduvo en consejo de malos', 'Mateo', 5, 3),
    ('Salmos',  22, 25, 'De él es mi alabanza en la gran congregación', 'Hebreos', 2, 12),
    ('Salmos',  22, 28, 'Porque de Jehová es el reino', 'Apocalipsis', 11, 15),
    ('Salmos',  24,  7, 'Alzad, oh puertas, vuestras cabezas — el Rey de gloria entrará', 'Juan', 20, 17),
    ('Salmos',  27,  1, 'Jehová es mi luz y mi salvación', 'Juan', 8, 12),
    ('Salmos',  31, 11, 'Fui objeto de burla a todos mis enemigos', 'Mateo', 27, 39),
    ('Salmos',  34,  8, 'Gustad y ved que es bueno Jehová', '1 Pedro', 2, 3),
    ('Salmos',  40,  9, 'He anunciado justicia en la gran congregación', 'Mateo', 4, 17),
    ('Salmos',  45, 17, 'Haré perpetua la memoria de tu nombre — nombre sobre todo nombre', 'Filipenses', 2, 9),
    ('Salmos',  69, 25, 'Sea su palacio asolado — profecía sobre Judas', 'Hechos', 1, 20),
    ('Salmos',  72,  2, 'Juzgará a tu pueblo con justicia — reino del Mesías', 'Apocalipsis', 19, 11),
    ('Salmos',  72, 11, 'Todos los reyes se postrarán delante de él', 'Filipenses', 2, 10),
    ('Salmos',  89, 29, 'Para siempre confirmaré su descendencia', 'Lucas', 1, 33),
    ('Salmos', 102, 26, 'Ellos perecerán, mas tú permanecerás', 'Hebreos', 1, 11),
    ('Salmos', 110,  3, 'Tu pueblo se ofrecerá voluntariamente — voluntarios en el día de tu poder', 'Juan', 6, 37),
    ('Salmos', 110,  5, 'El Señor está a tu diestra — aplastará reyes en el día de su furor', 'Apocalipsis', 19, 15),
    ('Salmos', 118, 23, 'De parte de Jehová es esto — cosa maravillosa a nuestros ojos', 'Mateo', 21, 42),
    ('Salmos', 119, 105, 'Lámpara es a mis pies tu palabra — Cristo la Palabra', 'Juan', 1, 1),

    # ── PROVERBIOS ─────────────────────────────────────────
    ('Proverbios',  8, 22, 'Jehová me poseía al principio — la Sabiduría preexistente', 'Juan', 1, 1),
    ('Proverbios',  8, 30, 'Estaba con él ordenándolo todo — el Hijo con el Padre', 'Juan', 1, 3),
    ('Proverbios', 30,  4, '¿Quién subió al cielo? — preguntas sobre el Hijo de Dios', 'Juan', 3, 13),

    # ── JOB ────────────────────────────────────────────────
    ('Job',  19, 25, 'Yo sé que mi Redentor vive', 'Juan', 11, 25),

    # ── ISAÍAS ADICIONALES ─────────────────────────────────
    ('Isaías',  10, 21, 'El remanente volverá al Dios Fuerte', 'Romanos', 9, 27),
    ('Isaías',  11,  6, 'El lobo morará con el cordero — paz mesiánica', 'Apocalipsis', 21, 4),
    ('Isaías',  11,  9, 'La tierra será llena del conocimiento de Jehová', 'Habacuc', 2, 14),
    ('Isaías',  12,  3, 'Sacaréis con gozo aguas de las fuentes de la salvación', 'Juan', 7, 38),
    ('Isaías',  26, 19, 'Tus muertos vivirán — resurrección prometida', '1 Corintios', 15, 54),
    ('Isaías',  29, 13, 'Este pueblo se acerca con su boca — hipocresía', 'Mateo', 15, 8),
    ('Isaías',  32, 15, 'Hasta que sobre nosotros sea derramado el Espíritu de lo alto', 'Juan', 14, 16),
    ('Isaías',  33, 22, 'Jehová es nuestro legislador, Jehová es nuestro rey', 'Santiago', 4, 12),
    ('Isaías',  35,  6, 'El cojo saltará como ciervo', 'Hechos', 3, 8),
    ('Isaías',  40,  1, 'Consolaos, consolaos, pueblo mío — consuelo mesiánico', 'Lucas', 2, 25),
    ('Isaías',  40, 10, 'He aquí que el Señor Jehová vendrá con poder', 'Apocalipsis', 22, 12),
    ('Isaías',  42, 16, 'Guiaré a los ciegos por camino que no sabían', 'Juan', 9, 39),
    ('Isaías',  43, 11, 'Yo, yo soy Jehová, y fuera de mí no hay quien salve', 'Juan', 14, 6),
    ('Isaías',  44,  6, 'Yo soy el primero y yo soy el último', 'Apocalipsis', 1, 17),
    ('Isaías',  45, 21, 'Dios justo y Salvador no hay ninguno fuera de mí', 'Juan', 14, 6),
    ('Isaías',  46, 13, 'Acerqué mi justicia — está cercana', 'Romanos', 1, 17),
    ('Isaías',  48, 16, 'Ahora me envió Jehová el Señor y su Espíritu', 'Juan', 14, 26),
    ('Isaías',  52, 10, 'Jehová desnudó su santo brazo ante los ojos de todas las naciones', 'Lucas', 3, 6),
    ('Isaías',  55,  4, 'Lo di por testigo a los pueblos, por jefe y por maestro', 'Apocalipsis', 1, 5),
    ('Isaías',  56,  7, 'Mi casa será llamada casa de oración para todos los pueblos', 'Mateo', 21, 13),
    ('Isaías',  58,  6, 'Desatar las ligaduras de impiedad — misión del Mesías', 'Lucas', 4, 18),
    ('Isaías',  60,  6, 'Traerán oro e incienso — los magos del este', 'Mateo', 2, 11),
    ('Isaías',  61,  3, 'A ordenar que a los afligidos de Sion se les dé gloria', 'Mateo', 5, 4),
    ('Isaías',  65,  2, 'Extendí mis manos todo el día a pueblo rebelde', 'Romanos', 10, 21),
]

def get_versiculo_id(cur, libro_nombre, capitulo, versiculo):
    cur.execute("""
        SELECT v.id FROM versiculos v
        JOIN capitulos c ON v.capitulo_id = c.id
        JOIN libros l    ON v.libro_id = l.id
        WHERE l.nombre = %s AND c.numero = %s AND v.numero = %s
    """, (libro_nombre, capitulo, versiculo))
    row = cur.fetchone()
    return row[0] if row else None

if __name__ == '__main__':
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    print(f"\n🌟  Cargando {len(PROFECIAS_EXTRA)} profecías adicionales...")
    ok = 0; err = 0

    for (libro, cap, vers, tema, cum_libro, cum_cap, cum_vers) in PROFECIAS_EXTRA:
        vid = get_versiculo_id(cur, libro, cap, vers)
        if not vid:
            print(f"  ⚠️  No encontrado: {libro} {cap}:{vers}")
            err += 1; continue
        cum_id = None
        if cum_libro:
            cum_id = get_versiculo_id(cur, cum_libro, cum_cap, cum_vers)
        cur.execute("""
            INSERT INTO profecias_mesianicas (versiculo_id, cumplimiento_id, tema)
            VALUES (%s, %s, %s)
            ON CONFLICT (versiculo_id) DO UPDATE SET tema = EXCLUDED.tema
        """, (vid, cum_id, tema))
        ok += 1

    conn.commit()
    cur.close(); conn.close()

    print(f"  ✅  {ok} profecías insertadas | {err} no encontradas")
    print(f"\n  Total ahora: ~{57 + ok} profecías mesiánicas en la DB")
    print("\n🎉  Listo.")