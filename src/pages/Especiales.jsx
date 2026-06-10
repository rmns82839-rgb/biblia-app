import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

// ─── QUERIES ─────────────────────────────────────────────────
async function getProfecias() {
  return await sql`
    SELECT
      pm.id, pm.tema,
      v.numero   AS versiculo,   v.texto   AS texto_at,
      l.nombre   AS libro_at,    l.abreviatura AS abrev_at,
      c.numero   AS capitulo_at, l.orden   AS orden_at,
      vc.numero  AS vers_cum,    vc.texto  AS texto_nt,
      lc.nombre  AS libro_nt,    lc.abreviatura AS abrev_nt,
      cc.numero  AS cap_cum,
      v.id AS versiculo_id_at,
      l.id AS libro_id_at, c.id AS cap_id_at,
      lc.id AS libro_id_nt, cc.id AS cap_id_nt
    FROM profecias_mesianicas pm
    JOIN versiculos v  ON pm.versiculo_id    = v.id
    JOIN capitulos  c  ON v.capitulo_id      = c.id
    JOIN libros     l  ON v.libro_id         = l.id
    LEFT JOIN versiculos vc ON pm.cumplimiento_id = vc.id
    LEFT JOIN capitulos  cc ON vc.capitulo_id     = cc.id
    LEFT JOIN libros     lc ON vc.libro_id        = lc.id
    ORDER BY l.orden, c.numero, v.numero
  `
}

async function getJuicios() {
  return await sql`
    SELECT
      jj.id, jj.estado, jj.sobre,
      jj.cuando_cumplido, jj.descripcion,
      v.numero  AS versiculo,  v.texto  AS texto,
      l.nombre  AS libro,      l.abreviatura AS abrev,
      c.numero  AS capitulo,   l.orden  AS orden,
      l.id AS libro_id, c.id AS cap_id
    FROM juicios_jehova jj
    JOIN versiculos v ON jj.versiculo_id = v.id
    JOIN capitulos  c ON v.capitulo_id   = c.id
    JOIN libros     l ON v.libro_id      = l.id
    ORDER BY jj.estado, l.orden, c.numero
  `
}

async function getPalabrasJesus() {
  return await sql`
    SELECT
      pj.tipo,
      v.numero  AS versiculo, v.texto AS texto,
      l.nombre  AS libro,     l.abreviatura AS abrev,
      c.numero  AS capitulo,  l.orden AS orden,
      l.id AS libro_id, c.id AS cap_id
    FROM palabras_jesus pj
    JOIN versiculos v ON pj.versiculo_id = v.id
    JOIN capitulos  c ON v.capitulo_id   = c.id
    JOIN libros     l ON v.libro_id      = l.id
    ORDER BY l.orden, c.numero, v.numero
  `
}

// ─── HELPERS ─────────────────────────────────────────────────
const TIPO_JESUS = {
  directo:    { label: 'Directo',    color: '#E07070', icon: '🔴' },
  parábola:   { label: 'Parábola',   color: '#FB923C', icon: '📖' },
  oración:    { label: 'Oración',    color: '#7EB8D4', icon: '🙏' },
  resucitado: { label: 'Resucitado', color: '#A78BFA', icon: '✨' },
}

const ESTADO_JUICIO = {
  cumplido:             { label: 'Cumplido',    color: '#34D399', icon: '✅' },
  por_cumplirse:        { label: 'Pendiente',   color: '#F87171', icon: '⏳' },
  cumplimiento_parcial: { label: 'Parcial',     color: '#FBBF24', icon: '🔶' },
}

function truncar(texto, max = 120) {
  if (!texto) return ''
  return texto.length > max ? texto.substring(0, max) + '...' : texto
}

// ─── TARJETA VERSÍCULO ───────────────────────────────────────
function VerseCard({ referencia, texto, badge, color, onClick, extra }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${color}25`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderLeftColor = color, e.currentTarget.style.borderColor = `${color}25`, e.currentTarget.style.borderLeftColor = color)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color, letterSpacing: '0.08em' }}>
          {referencia}
        </span>
        {badge && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 3, padding: '2px 6px', letterSpacing: '0.06em' }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
        {truncar(texto)}
      </p>
      {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
    </div>
  )
}

// ─── FILTRO CHIP ─────────────────────────────────────────────
function Chip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 12px',
        borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
        border: `1px solid ${active ? color : 'var(--border2)'}`,
        background: active ? `${color}18` : 'none',
        color: active ? color : 'var(--text-muted)',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function Especiales() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('profecias') // 'profecias' | 'juicios' | 'jesus'

  // Datos
  const [profecias, setProfecias]   = useState([])
  const [juicios, setJuicios]       = useState([])
  const [palabras, setPalabras]     = useState([])
  const [loading, setLoading]       = useState(false)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroLibro, setFiltroLibro] = useState('todos')
  const [busqueda, setBusqueda]     = useState('')

  // Cargar datos según tab
  useEffect(() => {
    setLoading(true)
    setBusqueda('')
    setFiltroTipo('todos')
    setFiltroLibro('todos')

    const fn = tab === 'profecias' ? getProfecias
             : tab === 'juicios'   ? getJuicios
             : getPalabrasJesus

    fn().then(data => {
      if (tab === 'profecias') setProfecias(data)
      else if (tab === 'juicios') setJuicios(data)
      else setPalabras(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tab])

  // ─── PROFECÍAS ───────────────────────────────────────────
  const librosProfecias = [...new Set(profecias.map(p => p.libro_at))].sort()
  const profeciasFiltradas = profecias.filter(p => {
    const matchLibro = filtroLibro === 'todos' || p.libro_at === filtroLibro
    const matchBusq  = !busqueda || p.tema?.toLowerCase().includes(busqueda.toLowerCase()) ||
                       p.texto_at?.toLowerCase().includes(busqueda.toLowerCase())
    return matchLibro && matchBusq
  })

  // ─── JUICIOS ─────────────────────────────────────────────
  const juiciosFiltrados = juicios.filter(j => {
    const matchEstado = filtroTipo === 'todos' || j.estado === filtroTipo
    const matchBusq   = !busqueda || j.sobre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                        j.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
                        j.texto?.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusq
  })

  const countJuicios = (estado) => juicios.filter(j => j.estado === estado).length

  // ─── PALABRAS DE JESÚS ───────────────────────────────────
  const librosPalabras = [...new Set(palabras.map(p => p.libro))].sort()
  const palabrasFiltradas = palabras.filter(p => {
    const matchTipo  = filtroTipo === 'todos' || p.tipo === filtroTipo
    const matchLibro = filtroLibro === 'todos' || p.libro === filtroLibro
    const matchBusq  = !busqueda || p.texto?.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchLibro && matchBusq
  })

  const countPalabras = (tipo) => palabras.filter(p => p.tipo === tipo).length

  function irAVersiculo(libroId, capId, capNum) {
    navigate(`/leer/${libroId}/${capNum}`)
  }

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 860, minWidth: 0 }}>

      {/* ─── TABS PRINCIPALES ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface2)', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'profecias', icon: '🟠', label: `Profecías Mesiánicas`, count: profecias.length || 272 },
          { key: 'juicios',   icon: '⚖️', label: `Juicios de Jehová`,    count: juicios.length || 30 },
          { key: 'jesus',     icon: '🔴', label: `Palabras de Jesús`,    count: palabras.length || 2202 },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, minWidth: 120,
              fontFamily: 'var(--mono)', fontSize: 10,
              padding: '10px 14px', borderRadius: 6, border: 'none',
              background: tab === t.key ? 'var(--gold)' : 'none',
              color: tab === t.key ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: tab === t.key ? 700 : 400,
              transition: 'all 0.2s', letterSpacing: '0.04em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count > 0 && (
              <span style={{
                background: tab === t.key ? 'rgba(0,0,0,0.2)' : 'var(--surface)',
                borderRadius: 10, padding: '1px 7px', fontSize: 9,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── BUSCADOR ─── */}
      <div style={{ marginBottom: 16 }}>
        <input
          style={{
            width: '100%', background: 'var(--surface2)',
            border: '1px solid var(--border2)', color: 'var(--text)',
            fontFamily: 'var(--sans)', fontSize: 13,
            padding: '10px 16px', borderRadius: 'var(--radius)', outline: 'none',
          }}
          placeholder={
            tab === 'profecias' ? 'Buscar por tema o texto...' :
            tab === 'juicios'   ? 'Buscar por nación, descripción...' :
            'Buscar en el texto...'
          }
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* PROFECÍAS MESIÁNICAS */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'profecias' && (
        <div>
          {/* Filtro por libro AT */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LIBRO:</span>
            <Chip label="Todos" active={filtroLibro === 'todos'} color="var(--gold)" onClick={() => setFiltroLibro('todos')} />
            {librosProfecias.map(l => (
              <Chip key={l} label={l} active={filtroLibro === l} color="#FB923C" onClick={() => setFiltroLibro(l)} />
            ))}
          </div>

          {/* Contador */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>
            {loading ? 'Cargando...' : `${profeciasFiltradas.length} profecías mesiánicas`}
            {filtroLibro !== 'todos' && ` en ${filtroLibro}`}
          </div>

          {loading ? (
            <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profeciasFiltradas.map(p => (
                <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid rgba(251,146,60,0.2)', borderLeft: '3px solid #FB923C', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  {/* Tema */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#FB923C', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {p.tema}
                  </div>

                  {/* AT → NT en dos columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'start' }}>
                    {/* AT */}
                    <div
                      onClick={() => irAVersiculo(p.libro_id_at, p.cap_id_at, p.capitulo_at)}
                      style={{ cursor: 'pointer', padding: '10px 12px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 4, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'}
                    >
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', marginBottom: 6, letterSpacing: '0.08em' }}>
                        {p.abrev_at} {p.capitulo_at}:{p.versiculo} — PROFECÍA
                      </div>
                      <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                        {truncar(p.texto_at, 160)}
                      </p>
                    </div>

                    {/* Flecha */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FB923C', fontSize: 18, paddingTop: 20 }}>→</div>

                    {/* NT */}
                    {p.texto_nt ? (
                      <div
                        onClick={() => irAVersiculo(p.libro_id_nt, p.cap_id_nt, p.cap_cum)}
                        style={{ cursor: 'pointer', padding: '10px 12px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 4, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#34D399'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.15)'}
                      >
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', marginBottom: 6, letterSpacing: '0.08em' }}>
                          {p.abrev_nt} {p.cap_cum}:{p.vers_cum} — CUMPLIMIENTO
                        </div>
                        <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                          {truncar(p.texto_nt, 160)}
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                          Cumplimiento tipológico
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* JUICIOS DE JEHOVÁ */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'juicios' && (
        <div>
          {/* Filtros por estado */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            <Chip label={`Todos (${juicios.length})`} active={filtroTipo === 'todos'} color="var(--gold)" onClick={() => setFiltroTipo('todos')} />
            <Chip label={`✅ Cumplidos (${countJuicios('cumplido')})`} active={filtroTipo === 'cumplido'} color="#34D399" onClick={() => setFiltroTipo('cumplido')} />
            <Chip label={`⏳ Pendientes (${countJuicios('por_cumplirse')})`} active={filtroTipo === 'por_cumplirse'} color="#F87171" onClick={() => setFiltroTipo('por_cumplirse')} />
            <Chip label={`🔶 Parciales (${countJuicios('cumplimiento_parcial')})`} active={filtroTipo === 'cumplimiento_parcial'} color="#FBBF24" onClick={() => setFiltroTipo('cumplimiento_parcial')} />
          </div>

          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>
            {loading ? 'Cargando...' : `${juiciosFiltrados.length} juicios`}
          </div>

          {loading ? (
            <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {juiciosFiltrados.map(j => {
                const est = ESTADO_JUICIO[j.estado] || ESTADO_JUICIO.cumplido
                return (
                  <div key={j.id} style={{ background: 'var(--surface)', border: `1px solid ${est.color}25`, borderLeft: `3px solid ${est.color}`, borderRadius: 'var(--radius)', padding: '16px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16 }}>{est.icon}</span>
                      <span style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 15, color: est.color }}>
                        {j.sobre}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: est.color, background: `${est.color}15`, border: `1px solid ${est.color}30`, borderRadius: 3, padding: '2px 8px', letterSpacing: '0.06em' }}>
                        {est.label}
                      </span>
                      {j.cuando_cumplido && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {j.cuando_cumplido}
                        </span>
                      )}
                    </div>

                    {/* Descripción */}
                    {j.descripcion && (
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                        {j.descripcion}
                      </p>
                    )}

                    {/* Versículo */}
                    <div
                      onClick={() => irAVersiculo(j.libro_id, j.cap_id, j.capitulo)}
                      style={{ padding: '10px 12px', background: `${est.color}08`, border: `1px solid ${est.color}20`, borderRadius: 4, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = est.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = `${est.color}20`}
                    >
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: est.color, marginBottom: 4, letterSpacing: '0.08em' }}>
                        {j.abrev} {j.capitulo}:{j.versiculo}
                      </div>
                      <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                        {truncar(j.texto, 200)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* PALABRAS DE JESÚS */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'jesus' && (
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <Chip label={`Todos (${palabras.length})`} active={filtroTipo === 'todos'} color="var(--gold)" onClick={() => setFiltroTipo('todos')} />
            {Object.entries(TIPO_JESUS).map(([key, val]) => (
              <Chip key={key} label={`${val.icon} ${val.label} (${countPalabras(key)})`} active={filtroTipo === key} color={val.color} onClick={() => setFiltroTipo(key)} />
            ))}
          </div>

          {/* Filtro libro */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LIBRO:</span>
            <Chip label="Todos" active={filtroLibro === 'todos'} color="var(--gold)" onClick={() => setFiltroLibro('todos')} />
            {librosPalabras.map(l => (
              <Chip key={l} label={l} active={filtroLibro === l} color="#E07070" onClick={() => setFiltroLibro(l)} />
            ))}
          </div>

          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>
            {loading ? 'Cargando...' : `${palabrasFiltradas.length} versículos`}
          </div>

          {loading ? (
            <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {palabrasFiltradas.map((p, i) => {
                const tipo = TIPO_JESUS[p.tipo] || TIPO_JESUS.directo
                return (
                  <div
                    key={i}
                    onClick={() => irAVersiculo(p.libro_id, p.cap_id, p.capitulo)}
                    style={{ background: 'var(--surface)', border: `1px solid ${tipo.color}20`, borderLeft: `3px solid ${tipo.color}`, borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = tipo.color}
                    onMouseLeave={e => { e.currentTarget.style.borderLeftColor = tipo.color; e.currentTarget.style.borderColor = `${tipo.color}20`; e.currentTarget.style.borderLeftColor = tipo.color }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: tipo.color, letterSpacing: '0.08em' }}>
                        {p.abrev} {p.capitulo}:{p.versiculo}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: tipo.color, background: `${tipo.color}15`, border: `1px solid ${tipo.color}30`, borderRadius: 3, padding: '1px 6px' }}>
                        {tipo.icon} {tipo.label}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                      {truncar(p.texto, 180)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}