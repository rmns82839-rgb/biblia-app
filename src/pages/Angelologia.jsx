import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

async function getAngeles() {
  return await sql`
    SELECT a.*, v.texto AS texto_versiculo,
           l.id AS libro_id, c.numero AS cap_num
    FROM angeles a
    LEFT JOIN versiculos v ON a.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY a.tipo, a.nombre, a.libro
  `
}

const TIPOS = {
  arcángel:  { color: '#A78BFA', icon: '⚔️', label: 'Arcángel' },
  mensajero: { color: '#60A5FA', icon: '✉️', label: 'Mensajero' },
  querubín:  { color: '#C9A84C', icon: '✨', label: 'Querubín' },
  serafín:   { color: '#FB923C', icon: '🔥', label: 'Serafín' },
  teofanía:  { color: '#34D399', icon: '🌟', label: 'Ángel de Jehová' },
  hueste:    { color: '#F87171', icon: '⚔️', label: 'Hueste Celestial' },
  juicio:    { color: '#F87171', icon: '⚖️', label: 'Ángel de Juicio' },
  intercesor:{ color: '#818CF8', icon: '🙏', label: 'Intercesor' },
}

export default function Angelologia() {
  const [angeles, setAngeles]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busqueda, setBusqueda]     = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getAngeles().then(d => { setAngeles(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const tipos = [...new Set(angeles.map(a => a.tipo))]

  const filtrados = angeles.filter(a => {
    const matchTipo = filtroTipo === 'todos' || a.tipo === filtroTipo
    const matchBusq = !busqueda || a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                      a.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
                      a.mision?.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusq
  })

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 900, minWidth: 0 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>
          Angelología Bíblica
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Todos los ángeles, querubines, serafines y seres celestiales mencionados en la Biblia RV1960
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 180 }}
          placeholder="Buscar por nombre o misión..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button onClick={() => setFiltroTipo('todos')} style={{
          fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 14px', borderRadius: 4,
          border: `1px solid ${filtroTipo === 'todos' ? 'var(--gold)' : 'var(--border2)'}`,
          background: filtroTipo === 'todos' ? 'var(--gold-glow)' : 'none',
          color: filtroTipo === 'todos' ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
        }}>Todos ({angeles.length})</button>
        {tipos.map(t => {
          const info = TIPOS[t] || { color: 'var(--text-muted)', icon: '•', label: t }
          const count = angeles.filter(a => a.tipo === t).length
          return (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
              border: `1px solid ${filtroTipo === t ? info.color : 'var(--border2)'}`,
              background: filtroTipo === t ? `${info.color}18` : 'none',
              color: filtroTipo === t ? info.color : 'var(--text-muted)', cursor: 'pointer',
            }}>{info.icon} {info.label} ({count})</button>
          )
        })}
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
        {loading ? 'Cargando...' : `${filtrados.length} entradas`}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map((a, i) => {
            const info = TIPOS[a.tipo] || { color: '#7EB8D4', icon: '•', label: a.tipo }
            const isOpen = seleccionado === i
            return (
              <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${info.color}20`, borderLeft: `3px solid ${info.color}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div onClick={() => setSeleccionado(isOpen ? null : i)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{info.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--crimson)', fontSize: 17, color: 'var(--text)' }}>{a.nombre}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: info.color, background: `${info.color}15`, border: `1px solid ${info.color}30`, borderRadius: 3, padding: '2px 7px' }}>
                        {info.label}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {a.libro} {a.capitulo}:{a.versiculo}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {a.mision}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '12px 0' }}>
                      {a.descripcion}
                    </p>
                    {a.texto_versiculo && (
                      <div onClick={() => navigate(`/leer/${a.libro_id}/${a.cap_num}`)}
                        style={{ padding: '10px 14px', background: `${info.color}08`, border: `1px solid ${info.color}20`, borderRadius: 4, cursor: 'pointer' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: info.color, marginBottom: 4 }}>
                          {a.libro} {a.capitulo}:{a.versiculo} →
                        </div>
                        <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                          {a.texto_versiculo?.substring(0, 220)}...
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
    </main>
  )
}