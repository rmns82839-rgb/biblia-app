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

// ─── VERSÍCULOS ESPECIALES POR CAPÍTULO ─────────────────────
export async function getEspecialesPorCapitulo(capituloId) {
  return await sql`
    SELECT
      v.id AS versiculo_id,
      v.numero,
      pj.tipo          AS tipo_jesus,
      pm.tema          AS tema_mesianico,
      jj.estado        AS estado_juicio,
      jj.sobre         AS juicio_sobre,
      jj.descripcion   AS juicio_descripcion,
      pm.descripcion   AS profecia_descripcion
    FROM versiculos v
    LEFT JOIN palabras_jesus      pj ON v.id = pj.versiculo_id
    LEFT JOIN profecias_mesianicas pm ON v.id = pm.versiculo_id
    LEFT JOIN juicios_jehova       jj ON v.id = jj.versiculo_id
    WHERE v.capitulo_id = ${capituloId}
      AND (pj.id IS NOT NULL OR pm.id IS NOT NULL OR jj.id IS NOT NULL)
    ORDER BY v.numero
  `
}

export async function getContadorEspeciales(capituloId) {
  const rows = await sql`
    SELECT
      COUNT(DISTINCT pj.versiculo_id) AS palabras_jesus,
      COUNT(DISTINCT pm.versiculo_id) AS profecias_mesianicas,
      COUNT(DISTINCT jj.versiculo_id) FILTER (WHERE jj.estado = 'cumplido')       AS juicios_cumplidos,
      COUNT(DISTINCT jj.versiculo_id) FILTER (WHERE jj.estado = 'por_cumplirse')  AS juicios_por_cumplir,
      COUNT(DISTINCT jj.versiculo_id) FILTER (WHERE jj.estado = 'cumplimiento_parcial') AS juicios_parciales
    FROM versiculos v
    LEFT JOIN palabras_jesus      pj ON v.id = pj.versiculo_id
    LEFT JOIN profecias_mesianicas pm ON v.id = pm.versiculo_id
    LEFT JOIN juicios_jehova       jj ON v.id = jj.versiculo_id
    WHERE v.capitulo_id = ${capituloId}
  `
  return rows[0]
}