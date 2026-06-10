import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

async function getNumeros() {
  return await sql`
    SELECT n.*, v.texto AS texto_versiculo,
           l.id AS libro_id, c.numero AS cap_num
    FROM numeros_biblicos n
    LEFT JOIN versiculos v ON n.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY n.numero
  `
}

async function getBuscarNumeroEnBiblia(numero) {
  // Buscar el número como palabra en los versículos
  const terminos = {
    3:  ['tres', 'tercero', 'tercera'],
    7:  ['siete', 'séptimo', 'séptima'],
    12: ['doce', 'duodécimo'],
    40: ['cuarenta'],
    70: ['setenta'],
  }
  return []
}

const TIPOS_COLOR = {
  divino:       '#C9A84C',
  teológico:    '#A78BFA',
  creación:     '#34D399',
  humano:       '#FB923C',
  prueba:       '#F87171',
  legal:        '#60A5FA',
  gobierno:     '#818CF8',
  profético:    '#FB923C',
  redentor:     '#34D399',
  sacerdotal:   '#7EB8D4',
  celestial:    '#C9A84C',
  escatológico: '#F87171',
  simbólico:    '#FBBF24',
  gracia:       '#6AAF7E',
}

export default function Numerologia() {
  const [numeros, setNumeros]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [seleccionado, setSeleccionado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getNumeros().then(d => { setNumeros(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const tipos = [...new Set(numeros.map(n => n.tipo))]

  const filtrados = filtroTipo === 'todos' ? numeros : numeros.filter(n => n.tipo === filtroTipo)

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 900, minWidth: 0 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>
          Numerología Bíblica
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Los números con significado teológico en la Biblia — su simbolismo y contexto según el texto RV1960
        </p>
      </div>

      {/* Nota aclaratoria */}
      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#C9A84C', lineHeight: 1.6, margin: 0 }}>
          <strong>Nota:</strong> Los significados se basan en el uso consistente de estos números en el texto bíblico mismo, no en especulaciones externas. El número tiene significado porque Dios lo usa repetidamente en contextos similares a lo largo de toda la Escritura.
        </p>
      </div>

      {/* Filtros por tipo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setFiltroTipo('todos')} style={{
          fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 14px', borderRadius: 4,
          border: `1px solid ${filtroTipo === 'todos' ? 'var(--gold)' : 'var(--border2)'}`,
          background: filtroTipo === 'todos' ? 'var(--gold-glow)' : 'none',
          color: filtroTipo === 'todos' ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
        }}>Todos ({numeros.length})</button>
        {tipos.map(t => {
          const color = TIPOS_COLOR[t] || 'var(--text-muted)'
          const count = numeros.filter(n => n.tipo === t).length
          return (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '6px 12px', borderRadius: 4,
              border: `1px solid ${filtroTipo === t ? color : 'var(--border2)'}`,
              background: filtroTipo === t ? `${color}18` : 'none',
              color: filtroTipo === t ? color : 'var(--text-muted)', cursor: 'pointer',
            }}>{t} ({count})</button>
          )
        })}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrados.map((n, i) => {
            const color = TIPOS_COLOR[n.tipo] || '#C9A84C'
            const isOpen = seleccionado === i
            return (
              <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${color}20`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div onClick={() => setSeleccionado(isOpen ? null : i)} style={{ padding: '16px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' }}>

                  {/* Número grande */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 8, flexShrink: 0,
                    background: `${color}12`, border: `2px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--crimson)', fontSize: n.numero > 999 ? 14 : 28, color, fontWeight: 400, lineHeight: 1 }}>
                      {n.numero.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--crimson)', fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>
                      {n.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: color, fontStyle: 'italic', marginBottom: 4 }}>
                      {n.significado}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                      <span>{n.libro} {n.capitulo}:{n.versiculo}</span>
                      <span style={{ color, background: `${color}15`, borderRadius: 3, padding: '1px 6px', border: `1px solid ${color}30` }}>{n.tipo}</span>
                    </div>
                  </div>

                  <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    {/* Contexto bíblico */}
                    <div onClick={() => n.libro_id && navigate(`/leer/${n.libro_id}/${n.cap_num}`)}
                      style={{ padding: '12px 14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 4, cursor: n.libro_id ? 'pointer' : 'default', margin: '12px 0' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color, marginBottom: 6 }}>
                        {n.libro} {n.capitulo}:{n.versiculo} {n.libro_id ? '— ir al texto →' : ''}
                      </div>
                      <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                        "{n.contexto}"
                      </p>
                    </div>

                    {/* Apariciones del número en la Biblia */}
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 8 }}>
                      Para ver todas las apariciones de este número, usa el{' '}
                      <span
                        onClick={() => navigate('/patrones')}
                        style={{ color, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        módulo de Patrones
                      </span>
                      {' '}y busca "{n.nombre.toLowerCase()}".
                    </div>
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