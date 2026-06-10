import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

async function getReyes() {
  return await sql`
    SELECT r.*, v.texto AS texto_versiculo,
           l.id AS libro_id, c.numero AS cap_num
    FROM reyes r
    LEFT JOIN versiculos v ON r.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY r.reino DESC, r.inicio_ac DESC
  `
}

const COLOR_REINO = {
  'Unido':  '#C9A84C',
  'Judá':   '#60A5FA',
  'Israel': '#34D399',
}

const COLOR_EVAL = {
  'bueno': '#34D399',
  'malo':  '#F87171',
  'mixto': '#FBBF24',
}

const ICON_EVAL = { bueno: '✅', malo: '❌', mixto: '⚠️' }

export default function Reyes() {
  const [reyes, setReyes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroReino, setFiltroReino] = useState('todos')
  const [filtroEval, setFiltroEval]   = useState('todos')
  const [busqueda, setBusqueda]       = useState('')
  const [vista, setVista]             = useState('lista') // 'lista' | 'timeline'
  const [seleccionado, setSeleccionado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getReyes().then(d => { setReyes(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const reyesFiltrados = reyes.filter(r => {
    const matchReino = filtroReino === 'todos' || r.reino === filtroReino
    const matchEval  = filtroEval  === 'todos' || r.evaluacion === filtroEval
    const matchBusq  = !busqueda   || r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                       r.nota?.toLowerCase().includes(busqueda.toLowerCase())
    return matchReino && matchEval && matchBusq
  })

  // Para el timeline: ordenar cronológicamente
  const reyesTimeline = [...reyes]
    .filter(r => filtroReino === 'todos' || r.reino === filtroReino)
    .sort((a, b) => b.inicio_ac - a.inicio_ac)

  const minAno = Math.min(...reyes.map(r => r.fin_ac || 0))
  const maxAno = Math.max(...reyes.map(r => r.inicio_ac || 0))
  const rango  = maxAno - minAno

  function pctX(ano) {
    return ((maxAno - ano) / rango) * 100
  }

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 960, minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>
          Reyes de Israel y Judá
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Cronología completa basada en Edwin Thiele • Verificada con 1 y 2 Reyes, 1 y 2 Crónicas
        </p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 180 }}
          placeholder="Buscar rey..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {['todos','Unido','Judá','Israel'].map(r => (
          <button key={r} onClick={() => setFiltroReino(r)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
            border: `1px solid ${filtroReino === r ? (COLOR_REINO[r] || 'var(--gold)') : 'var(--border2)'}`,
            background: filtroReino === r ? `${COLOR_REINO[r] || 'var(--gold)'}18` : 'none',
            color: filtroReino === r ? (COLOR_REINO[r] || 'var(--gold)') : 'var(--text-muted)',
            cursor: 'pointer',
          }}>{r === 'todos' ? 'Todos los reinos' : `Reino de ${r}`}</button>
        ))}
        {['todos','bueno','malo','mixto'].map(e => (
          <button key={e} onClick={() => setFiltroEval(e)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
            border: `1px solid ${filtroEval === e ? (COLOR_EVAL[e] || 'var(--gold)') : 'var(--border2)'}`,
            background: filtroEval === e ? `${COLOR_EVAL[e] || 'var(--gold)'}18` : 'none',
            color: filtroEval === e ? (COLOR_EVAL[e] || 'var(--gold)') : 'var(--text-muted)',
            cursor: 'pointer',
          }}>{e === 'todos' ? 'Todos' : `${ICON_EVAL[e]} ${e.charAt(0).toUpperCase() + e.slice(1)}`}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[{k:'lista',l:'☰ Lista'},{k:'timeline',l:'📅 Línea de tiempo'}].map(v => (
            <button key={v.k} onClick={() => setVista(v.k)} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 14px', borderRadius: 4,
              border: `1px solid ${vista === v.k ? 'var(--gold)' : 'var(--border2)'}`,
              background: vista === v.k ? 'var(--gold-glow)' : 'none',
              color: vista === v.k ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
            }}>{v.l}</button>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
        {loading ? 'Cargando...' : `${reyesFiltrados.length} reyes`}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {/* ── VISTA LISTA ── */}
      {!loading && vista === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reyesFiltrados.map(r => {
            const colorR = COLOR_REINO[r.reino] || 'var(--gold)'
            const colorE = COLOR_EVAL[r.evaluacion] || 'var(--text-muted)'
            const isOpen = seleccionado === r.id
            return (
              <div key={r.id} style={{ background: 'var(--surface)', border: `1px solid ${colorR}20`, borderLeft: `3px solid ${colorR}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div onClick={() => setSeleccionado(isOpen ? null : r.id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Nombre */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--crimson)', fontSize: 18, color: 'var(--text)' }}>{r.nombre}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: colorR, background: `${colorR}15`, border: `1px solid ${colorR}30`, borderRadius: 3, padding: '2px 7px' }}>
                        {r.reino}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: colorE }}>
                        {ICON_EVAL[r.evaluacion]} {r.evaluacion}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span>📅 {r.inicio_ac} – {r.fin_ac} a.C.</span>
                      <span>⏱ {r.anos_reinado} {r.anos_reinado === 1 ? 'año' : 'años'}</span>
                      {r.profeta_contemporaneo && <span>📢 {r.profeta_contemporaneo}</span>}
                    </div>
                  </div>
                  {/* Referencia */}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: colorR }}>
                    {r.libro_referencia} {r.cap_referencia}:{r.vers_referencia}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 12, marginTop: 12 }}>
                      {r.nota}
                    </p>
                    {r.texto_versiculo && (
                      <div
                        onClick={() => navigate(`/leer/${r.libro_id}/${r.cap_num}`)}
                        style={{ padding: '10px 14px', background: `${colorR}08`, border: `1px solid ${colorR}20`, borderRadius: 4, cursor: 'pointer' }}
                      >
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: colorR, marginBottom: 4 }}>
                          {r.libro_referencia} {r.cap_referencia}:{r.vers_referencia} →
                        </div>
                        <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                          {r.texto_versiculo.substring(0, 200)}...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VISTA TIMELINE ── */}
      {!loading && vista === 'timeline' && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.06em' }}>
            {maxAno} a.C. ←─────────────────────────────────────→ {minAno} a.C.
          </div>
          {/* Leyenda */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.entries(COLOR_REINO).map(([reino, color]) => (
              <div key={reino} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: color }}/>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                  {reino === 'Unido' ? 'Reino Unido' : `Reino de ${reino}`}
                </span>
              </div>
            ))}
          </div>

          {['Unido','Judá','Israel'].map(reino => {
            const reysReino = reyesTimeline.filter(r => r.reino === reino)
            if (!reysReino.length) return null
            const color = COLOR_REINO[reino]
            return (
              <div key={reino} style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {reino === 'Unido' ? 'Reino Unido' : `Reino de ${reino}`}
                </div>
                <div style={{ position: 'relative', height: 'auto' }}>
                  {reysReino.map((r, i) => {
                    const inicio = pctX(r.inicio_ac)
                    const fin    = pctX(r.fin_ac || r.inicio_ac)
                    const ancho  = Math.max(fin - inicio, 1.5)
                    const colorE = COLOR_EVAL[r.evaluacion] || color
                    return (
                      <div key={r.id}
                        onClick={() => setSeleccionado(seleccionado === r.id ? null : r.id)}
                        title={`${r.nombre} — ${r.inicio_ac} al ${r.fin_ac} a.C.`}
                        style={{
                          position: 'relative',
                          display: 'flex', alignItems: 'center',
                          marginBottom: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {/* Barra */}
                        <div style={{
                          marginLeft: `${inicio}%`,
                          width: `${ancho}%`,
                          minWidth: 40,
                          height: 28,
                          background: `${colorE}30`,
                          border: `1px solid ${colorE}60`,
                          borderLeft: `3px solid ${colorE}`,
                          borderRadius: 3,
                          display: 'flex', alignItems: 'center',
                          padding: '0 6px',
                          overflow: 'hidden',
                          transition: 'all 0.15s',
                        }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: colorE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.nombre}
                          </span>
                        </div>
                        {/* Info al lado */}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                          {r.inicio_ac}–{r.fin_ac}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}