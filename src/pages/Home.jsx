import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEstadisticasGlobales } from '../lib/db.js'

export default function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getEstadisticasGlobales().then(setStats).catch(console.error)
  }, [])

  function fmt(n) {
    if (!n) return '...'
    return Number(n).toLocaleString('es-CO')
  }

  return (
    <main className="home fade-in">
      <p className="home-subtitle">Reina Valera 1960 · Edición de Estudio</p>

      <h1 className="home-title">
        La Palabra<br />de Dios
      </h1>

      <div className="home-stats">
        <div className="home-stat">
          <span className="home-stat-num">66</span>
          <span className="home-stat-label">Libros</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-num">{fmt(stats?.total_capitulos)}</span>
          <span className="home-stat-label">Capítulos</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-num">{fmt(stats?.total_versiculos)}</span>
          <span className="home-stat-label">Versículos</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-num">{fmt(stats?.total_palabras)}</span>
          <span className="home-stat-label">Palabras</span>
        </div>
      </div>

      <div className="home-cta">
        <Link to="/leer/1/1" className="btn-primary">
          Comenzar a leer
        </Link>
        <Link to="/buscar" className="btn-secondary">
          Buscar versículo
        </Link>
      </div>

      {/* Módulos próximos */}
      <div style={{
        marginTop: 64, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12, width: '100%', maxWidth: 760
      }}>
        {[
          { icon: '📖', label: 'Lector', desc: 'Navega los 66 libros', to: '/leer/1/1', active: true },
          { icon: '🔍', label: 'Buscador', desc: 'Busca en toda la Biblia', to: '/buscar', active: true },
          { icon: '📊', label: 'Patrones', desc: 'Análisis de frecuencias', to: '#', active: false },
          { icon: '🕊️', label: 'Angelología', desc: 'Ángeles en la Biblia', to: '#', active: false },
          { icon: '✝️', label: 'Cristología', desc: 'Referencias mesiánicas', to: '#', active: false },
          { icon: '👑', label: 'Reyes', desc: 'Línea de tiempo real', to: '#', active: false },
          { icon: '🔢', label: 'Numerología', desc: 'Números bíblicos', to: '#', active: false },
          { icon: '📝', label: 'Bosquejos', desc: 'Crea tu sermón', to: '#', active: false },
        ].map(m => (
          <Link
            key={m.label}
            to={m.to}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${m.active ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '16px',
              textDecoration: 'none',
              opacity: m.active ? 1 : 0.5,
              transition: 'all 0.2s',
              cursor: m.active ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              {m.label}
              {!m.active && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 8, letterSpacing: '0.06em' }}>
                  PRONTO
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
