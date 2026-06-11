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
    ORDER BY r.inicio_ac DESC
  `
}

const C = { Unido: '#C9A84C', Juda: '#60A5FA', Israel: '#34D399' }
const CE = { bueno: '#34D399', malo: '#F87171', mixto: '#FBBF24' }
const IE = { bueno: '✅', malo: '❌', mixto: '⚠️' }

function TarjetaRey({ rey, color }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ec = CE[rey.evaluacion] || color
  const eventos = rey.eventos_clave ? rey.eventos_clave.split('|') : []

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${open ? color : color + '30'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6, marginBottom: 8, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div onClick={() => setOpen(!open)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--crimson)', fontSize: 17, color: 'var(--text)', fontWeight: 500 }}>{rey.nombre}</span>
          <span style={{ fontSize: 13 }}>{IE[rey.evaluacion]}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 3, padding: '2px 6px', marginLeft: 'auto' }}>
            {rey.libro_referencia} {rey.cap_referencia}:{rey.vers_referencia}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>📅 {rey.inicio_ac}–{rey.fin_ac} a.C.</span>
          <span>⏱ {rey.anos_reinado} {rey.anos_reinado === 1 ? 'año' : 'años'}</span>
          {rey.profeta_contemporaneo && <span style={{ color: '#A78BFA' }}>📢 {rey.profeta_contemporaneo}</span>}
        </div>
      </div>

      {/* Detalle */}
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>

          {/* Nota general */}
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.75, margin: '12px 0' }}>
            {rey.nota}
          </p>

          {/* Logros */}
          {rey.logros && (
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 5, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', letterSpacing: '0.08em', marginBottom: 6 }}>✅ LOGROS</div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{rey.logros}</p>
              {rey.cita_logro && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', marginTop: 6, opacity: 0.8 }}>
                  📖 {rey.cita_logro}
                </div>
              )}
            </div>
          )}

          {/* Fracasos */}
          {rey.fracasos && (
            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#F87171', letterSpacing: '0.08em', marginBottom: 6 }}>❌ FRACASOS Y PECADOS</div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{rey.fracasos}</p>
              {rey.cita_fracaso && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#F87171', marginTop: 6, opacity: 0.8 }}>
                  📖 {rey.cita_fracaso}
                </div>
              )}
            </div>
          )}

          {/* Eventos clave */}
          {eventos.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: color, letterSpacing: '0.08em', marginBottom: 6 }}>📌 EVENTOS CLAVE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {eventos.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>·</span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{e.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Versículo */}
          {rey.texto_versiculo && rey.libro_id && (
            <div
              onClick={() => navigate(`/leer/${rey.libro_id}/${rey.cap_num}`)}
              style={{ padding: '10px 12px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 4, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color}
              onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color, marginBottom: 4 }}>
                {rey.libro_referencia} {rey.cap_referencia}:{rey.vers_referencia} — ir al texto →
              </div>
              <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
                "{rey.texto_versiculo.substring(0, 200)}{rey.texto_versiculo.length > 200 ? '...' : ''}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Reyes() {
  const [reyes, setReyes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista]     = useState('paralelo')
  const [filtroEval, setFiltroEval] = useState('todos')
  const [busqueda, setBusqueda]     = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getReyes().then(d => { setReyes(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const unidos = reyes.filter(r => r.reino === 'Unido')
  const juda   = reyes.filter(r => r.reino === 'Judá')
    .filter(r => filtroEval === 'todos' || r.evaluacion === filtroEval)
    .filter(r => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const israel = reyes.filter(r => r.reino === 'Israel')
    .filter(r => filtroEval === 'todos' || r.evaluacion === filtroEval)
    .filter(r => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const todos  = reyes
    .filter(r => filtroEval === 'todos' || r.evaluacion === filtroEval)
    .filter(r => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => b.inicio_ac - a.inicio_ac)

  // Timeline
  const MIN_ANO = 586; const MAX_ANO = 1050; const RANGO = MAX_ANO - MIN_ANO
  const pct = ano => ((MAX_ANO - ano) / RANGO) * 100

  return (
    <main style={{ flex: 1, padding: '24px 28px 100px', maxWidth: 1020, minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 34, color: 'var(--gold)', fontWeight: 300, marginBottom: 4 }}>
          Reyes de Israel y Judá
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Cronología de Edwin Thiele • Verificada con 1-2 Reyes y 1-2 Crónicas • Logros, fracasos y citas bíblicas por rey
        </p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 160 }}
          placeholder="Buscar rey..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {['todos','bueno','malo','mixto'].map(e => (
          <button key={e} onClick={() => setFiltroEval(e)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
            border: `1px solid ${filtroEval === e ? (CE[e] || 'var(--gold)') : 'var(--border2)'}`,
            background: filtroEval === e ? `${CE[e] || 'var(--gold)'}18` : 'none',
            color: filtroEval === e ? (CE[e] || 'var(--gold)') : 'var(--text-muted)', cursor: 'pointer',
          }}>{e === 'todos' ? 'Todos' : `${IE[e]} ${e}`}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[{ k:'paralelo', l:'⚖️ Paralelo' }, { k:'lista', l:'☰ Lista' }, { k:'timeline', l:'📅 Timeline' }].map(v => (
            <button key={v.k} onClick={() => setVista(v.k)} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
              border: `1px solid ${vista === v.k ? 'var(--gold)' : 'var(--border2)'}`,
              background: vista === v.k ? 'var(--gold-glow)' : 'none',
              color: vista === v.k ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
            }}>{v.l}</button>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ color: C.Unido, label: 'Reino Unido' }, { color: C.Juda, label: 'Judá (sur)' }, { color: C.Israel, label: 'Israel (norte)' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {/* ═══════════ VISTA PARALELA ═══════════ */}
      {!loading && vista === 'paralelo' && (
        <div>
          {/* Reino Unido */}
          {unidos.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.Unido, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${C.Unido}08`, borderRadius: 4, border: `1px solid ${C.Unido}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.Unido }}/>
                Reino Unido — 1050 a.C. — Saúl, David, Salomón
              </div>
              {unidos.map(r => <TarjetaRey key={r.id} rey={r} color={C.Unido} />)}
            </div>
          )}

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #F87171)' }}/>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171', letterSpacing: '0.08em', whiteSpace: 'nowrap', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 4, padding: '5px 12px' }}>
              ⚡ DIVISIÓN DEL REINO — 930 a.C.
            </div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #F87171, transparent)' }}/>
          </div>

          {/* Columnas paralelas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Judá */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.Juda, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${C.Juda}08`, borderRadius: 4, border: `1px solid ${C.Juda}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.Juda }}/>
                Reino de Judá — {juda.length} reyes
              </div>
              {juda.map(r => <TarjetaRey key={r.id} rey={r} color={C.Juda} />)}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#F87171', padding: '8px 12px', background: 'rgba(248,113,113,0.06)', borderRadius: 4, border: '1px solid rgba(248,113,113,0.2)', marginTop: 8 }}>
                💔 Caída de Jerusalén — 586 a.C. (Nabucodonosor)
              </div>
            </div>

            {/* Israel */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.Israel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${C.Israel}08`, borderRadius: 4, border: `1px solid ${C.Israel}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.Israel }}/>
                Reino de Israel — {israel.length} reyes
              </div>
              {israel.map(r => <TarjetaRey key={r.id} rey={r} color={C.Israel} />)}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#F87171', padding: '8px 12px', background: 'rgba(248,113,113,0.06)', borderRadius: 4, border: '1px solid rgba(248,113,113,0.2)', marginTop: 8 }}>
                💔 Caída de Samaria — 722 a.C. (Asiria)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ VISTA LISTA ═══════════ */}
      {!loading && vista === 'lista' && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
            {todos.length} reyes · orden cronológico
          </div>
          {todos.map(r => <TarjetaRey key={r.id} rey={r} color={C[r.reino] || 'var(--gold)'} />)}
        </div>
      )}

      {/* ═══════════ VISTA TIMELINE ═══════════ */}
      {!loading && vista === 'timeline' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            <span>1050 a.C.</span><span>950</span><span>850</span><span>750</span><span>650 a.C.</span>
          </div>

          {/* Judá */}
          <div style={{ marginBottom: 4, fontFamily: 'var(--mono)', fontSize: 9, color: C.Juda, letterSpacing: '0.08em', marginTop: 16 }}>JUDÁ</div>
          {[...unidos, ...reyes.filter(r => r.reino === 'Judá')].map(r => {
            const ini = pct(r.inicio_ac); const fin = pct(r.fin_ac || r.inicio_ac - 1)
            const ancho = Math.max(fin - ini, 1.5)
            const color = r.reino === 'Unido' ? C.Unido : C.Juda
            const ec = CE[r.evaluacion] || color
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                <div
                  title={`${r.nombre} — ${r.inicio_ac} al ${r.fin_ac} a.C. · ${r.anos_reinado} años · ${r.evaluacion}${r.profeta_contemporaneo ? ' · Profeta: ' + r.profeta_contemporaneo : ''}`}
                  style={{ marginLeft: `${ini}%`, width: `${ancho}%`, minWidth: 40, height: 28, background: `${ec}25`, border: `1px solid ${ec}50`, borderLeft: `3px solid ${ec}`, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/leer/${r.libro_id}/${r.cap_num}`)}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: ec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 6, whiteSpace: 'nowrap' }}>{r.inicio_ac}</span>
              </div>
            )
          })}

          {/* Divisor */}
          <div style={{ height: 1, background: 'rgba(248,113,113,0.4)', margin: '12px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', left: `${pct(930)}%`, top: -10, fontFamily: 'var(--mono)', fontSize: 8, color: '#F87171', whiteSpace: 'nowrap' }}>División 930 a.C.</span>
          </div>

          {/* Israel */}
          <div style={{ marginBottom: 4, fontFamily: 'var(--mono)', fontSize: 9, color: C.Israel, letterSpacing: '0.08em' }}>ISRAEL</div>
          {reyes.filter(r => r.reino === 'Israel').map(r => {
            const ini = pct(r.inicio_ac); const fin = pct(r.fin_ac || r.inicio_ac - 1)
            const ancho = Math.max(fin - ini, 1.5)
            const ec = CE[r.evaluacion] || C.Israel
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                <div
                  title={`${r.nombre} — ${r.inicio_ac} al ${r.fin_ac} a.C. · ${r.anos_reinado} años · ${r.evaluacion}${r.profeta_contemporaneo ? ' · Profeta: ' + r.profeta_contemporaneo : ''}`}
                  style={{ marginLeft: `${ini}%`, width: `${ancho}%`, minWidth: 40, height: 28, background: `${ec}25`, border: `1px solid ${ec}50`, borderLeft: `3px solid ${ec}`, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/leer/${r.libro_id}/${r.cap_num}`)}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: ec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 6, whiteSpace: 'nowrap' }}>{r.inicio_ac}</span>
              </div>
            )
          })}
          <div style={{ height: 1, background: 'rgba(248,113,113,0.4)', marginTop: 8, position: 'relative' }}>
            <span style={{ position: 'absolute', left: `${pct(722)}%`, top: -10, fontFamily: 'var(--mono)', fontSize: 8, color: '#F87171', whiteSpace: 'nowrap' }}>Caída 722 a.C.</span>
          </div>
        </div>
      )}
    </main>
  )
}