import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

// ─── LIBROS ──────────────────────────────────────────────────
export async function getLibros() {
  return await sql`
    SELECT id, orden, nombre, abreviatura, testamento, categoria,
           total_capitulos, total_versiculos, total_palabras,
           autor_tradicional, periodo_historico, idioma_original
    FROM libros
    ORDER BY orden
  `
}

export async function getLibro(id) {
  const rows = await sql`
    SELECT * FROM libros WHERE id = ${id}
  `
  return rows[0]
}

// ─── CAPÍTULOS ───────────────────────────────────────────────
export async function getCapitulos(libroId) {
  return await sql`
    SELECT id, numero, total_versiculos, total_palabras
    FROM capitulos
    WHERE libro_id = ${libroId}
    ORDER BY numero
  `
}

// ─── VERSÍCULOS ──────────────────────────────────────────────
export async function getVersiculos(capituloId) {
  return await sql`
    SELECT id, numero, texto, total_palabras
    FROM versiculos
    WHERE capitulo_id = ${capituloId}
    ORDER BY numero
  `
}

// ─── BÚSQUEDA ────────────────────────────────────────────────
export async function buscarVersiculos(termino, libroId = null, limite = 50) {
  if (libroId) {
    return await sql`
      SELECT v.id, v.numero, v.texto,
             l.nombre AS libro, l.abreviatura,
             c.numero AS capitulo,
             l.abreviatura || ' ' || c.numero || ':' || v.numero AS referencia
      FROM versiculos v
      JOIN capitulos c ON v.capitulo_id = c.id
      JOIN libros l    ON v.libro_id = l.id
      WHERE v.libro_id = ${libroId}
        AND to_tsvector('spanish', v.texto) @@ plainto_tsquery('spanish', ${termino})
      ORDER BY l.orden, c.numero, v.numero
      LIMIT ${limite}
    `
  }
  return await sql`
    SELECT v.id, v.numero, v.texto,
           l.nombre AS libro, l.abreviatura,
           c.numero AS capitulo,
           l.abreviatura || ' ' || c.numero || ':' || v.numero AS referencia
    FROM versiculos v
    JOIN capitulos c ON v.capitulo_id = c.id
    JOIN libros l    ON v.libro_id = l.id
    WHERE to_tsvector('spanish', v.texto) @@ plainto_tsquery('spanish', ${termino})
    ORDER BY l.orden, c.numero, v.numero
    LIMIT ${limite}
  `
}

export async function contarPalabra(palabra) {
  return await sql`
    SELECT l.nombre AS libro, l.abreviatura, l.orden,
           fp.conteo
    FROM frecuencia_palabras fp
    JOIN libros l ON fp.libro_id = l.id
    WHERE fp.capitulo_id IS NULL
      AND fp.palabra = ${palabra.toLowerCase()}
    ORDER BY fp.conteo DESC
  `
}

export async function getEstadisticasGlobales() {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*) FROM libros)     AS total_libros,
      (SELECT COUNT(*) FROM capitulos)  AS total_capitulos,
      (SELECT COUNT(*) FROM versiculos) AS total_versiculos,
      (SELECT SUM(total_palabras) FROM libros WHERE total_palabras IS NOT NULL) AS total_palabras
  `
  return rows[0]
}
