import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

async function getTitulos() {
  return await sql`
    SELECT t.*, v.texto AS texto_versiculo,
           l.id AS libro_id, c.numero AS cap_num
    FROM titulos_mesias t
    LEFT JOIN versiculos v ON t.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY t.categoria, t.titulo
  `
}

const CATEGORIAS = {
  divino:     { color: '#C9A84C', icon: '✦', label: 'Naturaleza Divina' },
  profético:  { color: '#FB923C', icon: '📜', label: 'Títulos Proféticos' },
  real:       { color: '#60A5FA', icon: '👑', label: 'Títulos Reales' },
  sacerdotal: { color: '#A78BFA', icon: '🕊️', label: 'Títulos Sacerdotales' },
  redentor:   { color: '#34D399', icon: '✝️', label: 'Títulos Redentores' },
  pastor:     { color: '#6AAF7E', icon: '🐑', label: 'Títulos de Pastor' },
}

export default function Cristologia() {
  const [titulos, setTitulos]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtrocat, setFiltrocat]   = useState('todos')
  const [busqueda, setBusqueda]     = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getTitulos().then(d => { setTitulos(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtrados = titulos.filter(t => {
    const matchCat  = filtrocat === 'todos' || t.categoria === filtrocat
    const matchBusq = !busqueda || t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                      t.contexto?.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBusq
  })

  const contarCat = (cat) => titulos.filter(t => t.categoria === cat).length

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 900, minWidth: 0 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>
          Cristología Bíblica
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Todos los nombres y títulos de Jesucristo en la Biblia — cada uno tomado directamente del texto RV1960
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 180 }}
          placeholder="Buscar título..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button onClick={() => setFiltrocat('todos')} style={{
          fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 14px', borderRadius: 4,
          border: `1px solid ${filtrocat === 'todos' ? 'var(--gold)' : 'var(--border2)'}`,
          background: filtrocat === 'todos' ? 'var(--gold-glow)' : 'none',
          color: filtrocat === 'todos' ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
        }}>Todos ({titulos.length})</button>
        {Object.entries(CATEGORIAS).map(([key, info]) => (
          <button key={key} onClick={() => setFiltrocat(key)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
            border: `1px solid ${filtrocat === key ? info.color : 'var(--border2)'}`,
            background: filtrocat === key ? `${info.color}18` : 'none',
            color: filtrocat === key ? info.color : 'var(--text-muted)', cursor: 'pointer',
          }}>{info.icon} {info.label} ({contarCat(key)})</button>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
        {loading ? 'Cargando...' : `${filtrados.length} títulos y nombres`}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {/* Grid de tarjetas */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtrados.map((t, i) => {
            const info = CATEGORIAS[t.categoria] || { color: 'var(--gold)', icon: '✦', label: t.categoria }
            const isOpen = seleccionado === i
            return (
              <div key={i}
                style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? info.color : info.color + '25'}`, borderTop: `3px solid ${info.color}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}
              >
                <div onClick={() => setSeleccionado(isOpen ? null : i)} style={{ padding: '16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{info.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--crimson)', fontSize: 17, color: info.color, lineHeight: 1.2, marginBottom: 4 }}>
                        {t.titulo}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                        {t.libro} {t.capitulo}:{t.versiculo}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: `2px solid ${info.color}40`, paddingLeft: 8 }}>
                    "{t.contexto?.substring(0, 100)}{t.contexto?.length > 100 ? '...' : ''}"
                  </p>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.7, margin: '12px 0', fontStyle: 'italic' }}>
                      "{t.contexto}"
                    </p>
                    {t.texto_versiculo && t.texto_versiculo !== t.contexto && (
                      <div onClick={() => navigate(`/leer/${t.libro_id}/${t.cap_num}`)}
                        style={{ padding: '10px 12px', background: `${info.color}08`, border: `1px solid ${info.color}20`, borderRadius: 4, cursor: 'pointer' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: info.color, marginBottom: 4 }}>
                          {t.libro} {t.capitulo}:{t.versiculo} — ir al texto completo →
                        </div>
                        <p style={{ fontFamily: 'var(--crimson)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                          {t.texto_versiculo?.substring(0, 160)}...
                        </p>
                      </div>
                    )}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: info.color, background: `${info.color}15`, border: `1px solid ${info.color}30`, borderRadius: 3, padding: '3px 8px', display: 'inline-block', marginTop: 10 }}>
                      {info.label}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}