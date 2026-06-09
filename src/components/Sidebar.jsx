import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLibros } from '../lib/db.js'

export default function Sidebar() {
  const [libros, setLibros] = useState([])
  const [abiertos, setAbiertos] = useState({ 'Antiguo': true, 'Nuevo': true })
  const { libroId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    getLibros().then(setLibros).catch(console.error)
  }, [])

  const categorias = {
    'Antiguo': [...new Set(libros.filter(l => l.testamento === 'Antiguo').map(l => l.categoria))],
    'Nuevo':   [...new Set(libros.filter(l => l.testamento === 'Nuevo').map(l => l.categoria))],
  }

  function toggleTestamento(t) {
    setAbiertos(prev => ({ ...prev, [t]: !prev[t] }))
  }

  return (
    <aside className="sidebar">
      {['Antiguo', 'Nuevo'].map(testamento => (
        <div key={testamento} className="sidebar-section testamento-group">
          <div
            className={`testamento-header ${abiertos[testamento] ? 'open' : ''}`}
            onClick={() => toggleTestamento(testamento)}
          >
            <span>{testamento} Testamento</span>
            <span className="testamento-chevron">▶</span>
          </div>

          {abiertos[testamento] && categorias[testamento].map(cat => (
            <div key={cat} style={{ marginBottom: 4 }}>
              <div className="sidebar-label" style={{ marginTop: 8 }}>{cat}</div>
              {libros
                .filter(l => l.testamento === testamento && l.categoria === cat)
                .map(libro => (
                  <button
                    key={libro.id}
                    className={`libro-btn ${String(libro.id) === String(libroId) ? 'active' : ''}`}
                    onClick={() => navigate(`/leer/${libro.id}/1`)}
                  >
                    <span className="libro-abrev">{libro.abreviatura}</span>
                    <span>{libro.nombre}</span>
                  </button>
                ))
              }
            </div>
          ))}
        </div>
      ))}
    </aside>
  )
}
