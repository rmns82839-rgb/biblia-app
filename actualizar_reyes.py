"""
============================================================
 ACTUALIZAR REYES — logros, fracasos, eventos, citas
 Fuente: 1-2 Reyes, 1-2 Crónicas, RV1960
 Uso: python actualizar_reyes.py
============================================================
"""
import os, sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Falta DATABASE_URL en .env")
    sys.exit(1)

DATOS = [
    ("Saúl", "Unido",
     "Primer rey ungido de Israel. Vencio a los amonitas en su inicio. Libero Jabes de Galaad.",
     "Ofrecio sacrificio sin ser sacerdote (1 S 13). Desobedecio al no destruir a Amalec (1 S 15). Consulto a la adivina de Endor. El Espiritu de Jehova se aparto de el.",
     "1 Samuel 11:11", "1 Samuel 15:23",
     "Ungido por Samuel | Rechazado por Dios | Persiguio a David | Muerto en Gilboa por los filisteos"),

    ("David", "Unido",
     "Conquisto Jerusalen como capital (2 S 5). Trajo el arca a Jerusalen. Extendio el reino. Recibio el pacto eterno de Dios (2 S 7). Autor de gran parte de los Salmos. Derroto a Goliat.",
     "Adulterio con Betsabe y asesinato de Urias (2 S 11). Censo al pueblo contra la voluntad de Dios (2 S 24). Sus hijos causaron grandes conflictos.",
     "2 Samuel 7:16", "2 Samuel 12:9",
     "Ungido en Belen | Mato a Goliat | Conquisto Jerusalen | Pacto davidico | Pecado con Betsabe | Rebelion de Absalon"),

    ("Salomón", "Unido",
     "Construyo el primer Templo de Jerusalen (1 R 6). Recibio sabiduria divina sin igual. Gran prosperidad y paz. Comercio internacional. Escribio Proverbios, Eclesiastes y Cantares.",
     "Se desvio hacia los idolos por sus 700 esposas extranjeras (1 R 11). Impuso trabajos forzados. Su idolatria causo la division del reino.",
     "1 Reyes 4:29", "1 Reyes 11:4",
     "Sabiduria divina | Construyo el Templo | Visita de la reina de Saba | Apostasia final | Division del reino anunciada"),

    ("Roboam", "Judá",
     "Fortalecio las ciudades de Juda con provisiones y guarniciones militares (2 Cr 11).",
     "Rechazo el consejo de los ancianos y aumento los impuestos causando la division del reino (1 R 12). Introdujo la idolatria. Sisac de Egipto saqueo el Templo.",
     "2 Cronicas 11:17", "1 Reyes 12:14",
     "Division del reino | Invasion de Sisac | Abandono la ley de Jehova"),

    ("Abías", "Judá",
     "Vencio a Jeroboam con 400.000 hombres aunque era inferior en numero (2 Cr 13).",
     "Siguio los pecados de su padre Roboam. Su corazon no fue perfecto como el de David.",
     "2 Cronicas 13:12", "1 Reyes 15:3",
     "Victoria sobre Jeroboam en el monte Zemaraim"),

    ("Asa", "Judá",
     "Quito los altares e idolos extranjeros. Vencio al etiope Zera con un millon de hombres clamando a Dios (2 Cr 14). Gran reforma religiosa nacional.",
     "Se apoyo en Ben-adad de Siria en lugar de Dios (2 Cr 16). Se enojo con el profeta Hanani y lo encarcelo. En su enfermedad busco medicos y no a Jehova.",
     "2 Cronicas 14:11", "2 Cronicas 16:9",
     "Reforma religiosa | Victoria sobre Zera | Alianza con Siria | Enfermedad y muerte"),

    ("Josafat", "Judá",
     "Envio levitas a ensenar la ley por todo Juda (2 Cr 17). Establecio jueces en todas las ciudades. Oro y Dios confundio a Moab, Amon y Edom (2 Cr 20).",
     "Se alio con el malvado Acab de Israel mediante matrimonio (2 Cr 18). Ayudo a Ocozias de Israel en negocios que desagradaron a Dios.",
     "2 Cronicas 17:6", "2 Cronicas 19:2",
     "Reforma judicial | Alianza con Acab | Victoria milagrosa sobre Moab | Naves destruidas en Ezion-geber"),

    ("Joram", "Judá",
     "Mantuvo unido el reino durante 8 anos a pesar de rebeliones.",
     "Mato a todos sus hermanos al subir al trono (2 Cr 21). Introdujo la idolatria por su esposa Atalia. Edom y Libna se rebelaron. Murio de terrible enfermedad intestinal.",
     "2 Reyes 8:19", "2 Cronicas 21:13",
     "Asesino a sus hermanos | Edom se rebelo | Carta de Elias | Muerte por enfermedad intestinal"),

    ("Ocozías", "Judá",
     "Ningun logro notable registrado en las Escrituras.",
     "Siguio el camino de la casa de Acab. Se alio con Joram de Israel. Fue muerto por Jehu junto con Joram (2 R 9).",
     "2 Reyes 8:27", "2 Reyes 8:27",
     "Asesinado por Jehu junto con Joram de Israel"),

    ("Atalía", "Judá",
     "Ningun logro espiritual registrado.",
     "Usurpo el trono matando a toda la descendencia real (2 R 11). Promovio el culto a Baal. Unica mujer que reino sobre Juda.",
     "2 Reyes 11:3", "2 Reyes 11:1",
     "Asesino a la familia real | Joas escondido en el Templo | Destronada y ejecutada por Joiada"),

    ("Joás", "Judá",
     "Reparo el Templo de Jehova (2 R 12). Fue bueno todos los dias que vivio el sacerdote Joiada.",
     "Tras la muerte de Joiada se desvio a los idolos. Mando matar a Zacarias hijo de Joiada (2 Cr 24). Entrego tesoros del Templo a Hazael de Siria.",
     "2 Reyes 12:14", "2 Cronicas 24:21",
     "Escondido de nino en el Templo | Reparo el Templo | Mato a Zacarias | Asesinado por sus siervos"),

    ("Amasías", "Judá",
     "Vencio a Edom en el valle de la Sal matando 10.000 edomitas (2 R 14). Comenzo su reinado haciendo lo recto.",
     "Adoro los dioses de Edom despues de vencerlos (2 Cr 25). Desafio a Joas de Israel y fue derrotado. Jerusalen fue saqueada.",
     "2 Reyes 14:7", "2 Cronicas 25:14",
     "Victoria sobre Edom | Adoro idolos edomitas | Derrotado por Israel | Conspiracion y muerte"),

    ("Uzías", "Judá",
     "Reinado mas largo y prospero de Juda (52 anos). Derroto a filisteos, arabes y amonitas. Fortalecio Jerusalen con torres y catapultas. Desarrollo agricola y militar notable (2 Cr 26).",
     "Entro al Templo a ofrecer incienso — funcion exclusiva de sacerdotes — y fue herido de lepra hasta su muerte (2 Cr 26:16-21).",
     "2 Cronicas 26:15", "2 Cronicas 26:18",
     "Grandes victorias militares | Prosperidad nacional | Lepra por usurpar funcion sacerdotal | Isaias recibio su llamado en el ano de su muerte"),

    ("Jotam", "Judá",
     "Construyo la puerta superior del Templo. Edifico ciudades en Juda. Vencio a los amonitas. Fue recto ante Jehova (2 Cr 27).",
     "No quito los lugares altos — el pueblo siguio corrompido (2 R 15:35).",
     "2 Cronicas 27:6", "2 Reyes 15:35",
     "Construccion del Templo y ciudades | Victoria sobre Amon | Reinado estable"),

    ("Acaz", "Judá",
     "Ningun logro espiritual. Solo logros politicos temporales aliandose con Asiria.",
     "Ofrecio sus hijos al fuego (2 Cr 28). Cerro el Templo y lo saqueo. Adoro los dioses de Damasco. En su tiempo Isaias anuncio la senal de Emanuel (Is 7:14).",
     "Isaias 7:14", "2 Reyes 16:3",
     "Invasion sirio-israelita | Senal de Emanuel (Is 7) | Cerro el Templo | Altar sirio en Jerusalen"),

    ("Ezequías", "Judá",
     "Purifico y reabrio el Templo. Destruyo la serpiente de bronce Nehustan. Gran Pascua. Jehova libro Jerusalen del asirio Senaquerib matando 185.000 soldados (2 R 19). Se le aniadieron 15 anos de vida. Construyo el tunel de Siloe.",
     "Mostro los tesoros del reino a los embajadores de Babilonia por lo que Isaias profetizo el cautiverio (2 R 20).",
     "2 Reyes 19:35", "2 Reyes 20:17",
     "Reforma religiosa total | Destruyo Nehustan | Gran Pascua | Senaquerib derrotado | 15 anos anadidos | Tunel de Siloe | Error con embajadores de Babilonia"),

    ("Manasés", "Judá",
     "En su vejez despues de ser llevado cautivo a Babilonia se humillo ante Dios fue restaurado y quito los idolos (2 Cr 33:12-16).",
     "El reinado mas malvado de Juda. Restauro todos los idolos que Ezequias destruyo. Ofrecio sus hijos al fuego. Practico adivinacion. Derramo sangre inocente en gran cantidad.",
     "2 Cronicas 33:13", "2 Reyes 21:11",
     "Restauro la idolatria | Causo el decreto del cautiverio | Llevado preso a Babilonia | Se arrepintio | Restaurado al trono"),

    ("Amón", "Judá",
     "Ningun logro registrado.",
     "Siguio todos los pecados de Manases sin arrepentirse. Fue asesinado por sus propios siervos a los 2 anos.",
     "2 Reyes 21:21", "2 Reyes 21:22",
     "Asesinado por sus siervos | El pueblo mato a los conspiradores y puso a Josias"),

    ("Josías", "Judá",
     "El mejor rey despues de David. Gran reforma religiosa. Encontro el libro de la ley en el Templo. Celebro la Pascua mas grande desde los jueces (2 Cr 35). Destruyo altares hasta Bet-el. Profetizado 300 anos antes por nombre (1 R 13:2).",
     "Salio a pelear contra Faraon Necao sin consultar a Dios ignorando su mensaje. Fue herido y murio en Meguido (2 Cr 35:22).",
     "2 Reyes 23:25", "2 Cronicas 35:22",
     "Profetizado 300 anos antes | Encontro el libro de la ley | Gran reforma | Gran Pascua | Muerte en Meguido"),

    ("Joacaz", "Judá",
     "Ningun logro registrado.",
     "Hizo lo malo ante Jehova. Reino solo 3 meses antes de ser deportado a Egipto por Faraon Necao donde murio.",
     "2 Reyes 23:32", "2 Reyes 23:33",
     "Reino 3 meses | Depuesto por Faraon Necao | Murio en Egipto"),

    ("Joacim", "Judá",
     "Ningun logro espiritual.",
     "Quemo el rollo de las profecias de Jeremias (Jer 36). Hizo lo malo ante Jehova. Se rebelo contra Nabucodonosor.",
     "Jeremias 36:2", "Jeremias 36:23",
     "Quemo el rollo de Jeremias | Sometido por Nabucodonosor | Primer exilio (Daniel fue en este tiempo)"),

    ("Joaquín", "Judá",
     "Fue sacado de la carcel en Babilonia y honrado por Evil-merodac al final de su vida (2 R 25:27-30).",
     "Hizo lo malo. Reino solo 3 meses. Fue llevado a Babilonia con 10.000 personas. Jeremias profetizo que ninguno de su descendencia reinaria.",
     "2 Reyes 25:27", "Jeremias 22:30",
     "Segundo exilio mas grande | 10.000 deportados | Ezequiel fue en este exilio | Liberado en Babilonia al final"),

    ("Sedequías", "Judá",
     "Ningun logro espiritual registrado.",
     "Ultimo rey de Juda. Ignoro las advertencias de Jeremias. Se rebelo contra Nabucodonosor. Jerusalen fue sitiada 2 anos. El Templo fue quemado. Sus hijos fueron muertos ante sus ojos y luego fue cegado.",
     "Jeremias 38:20", "2 Reyes 24:20",
     "Sitio de Jerusalen (588-586 a.C.) | Destruccion del Templo | Sus hijos asesinados | Cegado y deportado | Fin del reino de Juda"),

    ("Jeroboam I", "Israel",
     "Fue esforzoso y capaz. Dios le prometio el reino del norte si obedecia.",
     "Establecio becerros de oro en Bet-el y Dan. Invento un sacerdocio no levitico. Su pecado se convirtio en el patron de todos los reyes de Israel.",
     "1 Reyes 11:38", "1 Reyes 12:28",
     "Establecio el becerro de oro | Mano seca y restaurada | Profecia del hombre de Dios sobre Josias"),

    ("Nadab", "Israel",
     "Ningun logro registrado.",
     "Siguio el pecado de su padre Jeroboam. Fue asesinado por Baasa cumpliendose la profecia de Ahias.",
     "1 Reyes 15:26", "1 Reyes 15:27",
     "Asesinado por Baasa | Cumplimiento de profecia sobre la casa de Jeroboam"),

    ("Baasa", "Israel",
     "Extermino toda la casa de Jeroboam segun la profecia de Ahias.",
     "Siguio el pecado de Jeroboam. Hizo guerra constante contra Juda. Dios envio al profeta Jehu a anunciar su juicio.",
     "1 Reyes 15:33", "1 Reyes 16:2",
     "Guerra con Juda | Profecia de Jehu contra su casa"),

    ("Ela", "Israel",
     "Ningun logro registrado.",
     "Se embriagaba en casa de su mayordomo. Fue asesinado por Zimri. Siguio el pecado de Jeroboam.",
     "1 Reyes 16:9", "1 Reyes 16:13",
     "Asesinado por Zimri mientras bebia"),

    ("Zimri", "Israel",
     "Elimino toda la casa de Baasa cumpliendo la profecia.",
     "Reino solo 7 dias. Cuando Omri marcho contra el se quemo en el palacio. Su nombre se volvio sinonimo de traidor.",
     "1 Reyes 16:12", "1 Reyes 16:19",
     "Reino 7 dias | Se quemo en el palacio | Nombre sinonimo de traidor"),

    ("Omri", "Israel",
     "Fundador de Samaria como capital. Gran rey politico y militar. Asiria llamo a Israel casa de Omri por mas de 100 anos.",
     "Peor que todos sus predecesores en maldad. Establecio alianza con Fenicia casando a Acab con Jezabel introduciendo el culto a Baal.",
     "1 Reyes 16:24", "1 Reyes 16:25",
     "Fundo Samaria | Alianza con Fenicia | Israel conocido como Casa de Omri por Asiria"),

    ("Acab", "Israel",
     "Gran militar — vencio dos veces a Ben-adad de Siria (1 R 20). Mostro cierto arrepentimiento cuando Elias le anuncio juicio (1 R 21:29).",
     "El mas malvado de los reyes de Israel. Caso con Jezabel que introdujo el culto a Baal. Asesino a Nabot por su vina. Construyo un altar a Baal en Samaria.",
     "1 Reyes 20:13", "1 Reyes 21:25",
     "Elias en el Carmelo | 450 profetas de Baal muertos | Nabot asesinado | Victoria sobre Ben-adad | Muerto en Ramot de Galaad"),

    ("Ocozías", "Israel",
     "Ningun logro registrado.",
     "Siguio el pecado de sus padres Acab y Jezabel. Consulto a Baal-zebub de Ecron cuando enferme. Elias anuncio su muerte.",
     "1 Reyes 22:53", "2 Reyes 1:3",
     "Consulto a Baal-zebub | Elias anuncio su muerte | Murio sin hijo varon"),

    ("Joram", "Israel",
     "Quito la estatua de Baal que su padre habia hecho. Busco a Eliseo en tiempo de crisis.",
     "Mantuvo los becerros de oro de Jeroboam. Fue herido por los sirios en Ramot de Galaad. Murio a manos de Jehu.",
     "2 Reyes 3:2", "2 Reyes 3:3",
     "Campana contra Moab con Eliseo | Siria sitio Samaria | Naaman sanado | Herido en Ramot | Muerto por Jehu"),

    ("Jehú", "Israel",
     "Ejecuto el juicio de Dios sobre la casa de Acab. Mato a Joram Jezabel y 70 hijos de Acab. Destruyo el templo de Baal. Dios prometio cuatro generaciones en el trono.",
     "No se aparto de los pecados de Jeroboam. Israel fue reducido y oprimido por Hazael de Siria.",
     "2 Reyes 10:30", "2 Reyes 10:31",
     "Ungido por el profeta | Mato a Joram y Jezabel | Destruyo el templo de Baal | Israel oprimido por Siria"),

    ("Joacaz", "Israel",
     "Se humillo ante Jehova y Dios le escucho. Dios le dio un salvador que libero a Israel de Siria (2 R 13:4-5).",
     "Siguio los pecados de Jeroboam. Israel fue reducido a 50 jinetes 10 carros y 10.000 infantes por Hazael de Siria.",
     "2 Reyes 13:4", "2 Reyes 13:6",
     "Israel gravemente oprimido por Siria | Se humillo y Dios envio un salvador"),

    ("Joás", "Israel",
     "Recupero las ciudades que Siria habia tomado a Israel segun la profecia de Eliseo. Visito a Eliseo en su lecho de muerte. Derroto a Amazias de Juda.",
     "Continuo con los pecados de Jeroboam.",
     "2 Reyes 13:25", "2 Reyes 13:11",
     "Visito a Eliseo moribundo | Tres victorias sobre Siria | Derroto a Amazias de Juda"),

    ("Jeroboam II", "Israel",
     "El reinado mas largo y prospero del norte (41 anos). Restablecio los limites de Israel cumpliendo la profecia de Jonas (2 R 14:25). Gran prosperidad economica.",
     "Continuo los pecados de Jeroboam. Gran injusticia social — Amos profetizo contra los ricos que oprimian a los pobres.",
     "2 Reyes 14:27", "Amos 6:1",
     "Prosperidad y expansion territorial | Injusticia social | Ministerio de Amos y Oseas"),

    ("Zacarías", "Israel",
     "Ultimo rey de la dinastia de Jehu cumpliendo la promesa de 4 generaciones.",
     "Continuo los pecados de Jeroboam. Reino solo 6 meses. Fue asesinado publicamente por Salum.",
     "2 Reyes 15:9", "2 Reyes 15:10",
     "Fin de la dinastia de Jehu | Asesinado publicamente por Salum"),

    ("Salum", "Israel",
     "Ningun logro registrado.",
     "Reino solo 1 mes. Fue asesinado por Manahem. Israel entro en anarquia.",
     "2 Reyes 15:13", "2 Reyes 15:14",
     "Reino 1 mes | Asesinado por Manahem"),

    ("Manahem", "Israel",
     "Mantuvo el trono 10 anos en un periodo de inestabilidad.",
     "Aplasto brutalmente a Tifsa matando a mujeres embarazadas (2 R 15:16). Se sometio a Asiria pagando 1.000 talentos de plata a Pul (Tiglat-pileser III). Continuo los pecados de Jeroboam.",
     "2 Reyes 15:19", "2 Reyes 15:16",
     "Tributo a Asiria | Tiglat-pileser III recibio tributo | Crueldad con Tifsa"),

    ("Pekaía", "Israel",
     "Ningun logro registrado.",
     "Continuo los pecados de Jeroboam. Fue asesinado por su capitan Peka en el palacio.",
     "2 Reyes 15:24", "2 Reyes 15:25",
     "Asesinado por su capitan Peka en el palacio"),

    ("Peka", "Israel",
     "Se alio con Rezin de Siria para resistir a Asiria.",
     "Continuo los pecados de Jeroboam. Se alio con Siria para atacar a Juda en los dias de Acaz. Asiria tomo Galilea y Neftali llevando cautivos. Fue asesinado por Oseas.",
     "Isaias 7:1", "2 Reyes 15:29",
     "Guerra siro-efraimita contra Juda | Senal de Emanuel (Is 7) | Asiria tomo el norte de Israel | Asesinado por Oseas"),

    ("Oseas", "Israel",
     "Fue menos malo que los reyes anteriores segun el registro biblico (2 R 17:2).",
     "Ultimo rey de Israel. Se alio con Egipto traicionando a Asiria. Salmanasar V sitio Samaria por 3 anos. En 722 a.C. Sargon II tomo Samaria y deporto a los israelitas. Fin del reino del norte.",
     "2 Reyes 17:2", "2 Reyes 17:18",
     "Sitio de Samaria 3 anos | Caida de Samaria 722 a.C. | Deportacion de Israel a Asiria | Fin del reino del norte"),
]

def actualizar(cur):
    print(f"\n  Actualizando {len(DATOS)} reyes con logros, fracasos y eventos...")
    ok = 0; err = 0
    for d in DATOS:
        nombre, reino, logros, fracasos, cita_logro, cita_fracaso, eventos = d
        cur.execute("""
            UPDATE reyes SET
                logros        = %s,
                fracasos      = %s,
                cita_logro    = %s,
                cita_fracaso  = %s,
                eventos_clave = %s
            WHERE nombre = %s AND reino = %s
        """, (logros, fracasos, cita_logro, cita_fracaso, eventos, nombre, reino))
        if cur.rowcount > 0:
            ok += 1
        else:
            print(f"  No encontrado: {nombre} ({reino})")
            err += 1
    print(f"  OK: {ok} reyes actualizados | NO ENCONTRADOS: {err}")

if __name__ == '__main__':
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    actualizar(cur)
    conn.commit()
    cur.close()
    conn.close()
    print("\nDatos de reyes actualizados en Neon.")