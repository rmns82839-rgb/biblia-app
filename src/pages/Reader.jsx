import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLibro, getCapitulos, getVersiculos } from '../lib/db.js'

export default function Reader() {
  const { libroId, capituloNum } = useParams()
  const navigate = useNavigate()

  const [libro, setLibro]       = useState(null)
  const [capitulos, setCapitulos] = useState([])
  const [versiculos, setVersiculos] = useState([])
  const [capActual, setCapActual] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [highlighted, setHighlighted] = useState(null)
  const verseRef = useRef({})

  // Cargar libro
  useEffect(() => {
    if (!libroId) return
    setLoading(true)
    Promise.all([getLibro(libroId), getCapitulos(libroId)])
      .then(([lib, caps]) => {
        setLibro(lib)
        setCapitulos(caps)
      })
      .catch(console.error)
  }, [libroId])

  // Cargar versículos
  useEffect(() => {
    if (!capitulos.length) return
    const num = parseInt(capituloNum) || 1
    const cap = capitulos.find(c => c.numero === num) || capitulos[0]
    if (!cap) return
    setCapActual(cap)
    setLoading(true)
    getVersiculos(cap.id)
      .then(vers => { setVersiculos(vers); setLoading(false) })
      .catch(console.error)
  }, [capitulos, capituloNum])

  function irCapitulo(num) {
    navigate(`/leer/${libroId}/${num}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function irAnterior() {
    const num = capActual?.numero || 1
    if (num > 1) irCapitulo(num - 1)
    else {
      // ir al libro anterior
      const prevLibroId = parseInt(libroId) - 1
      if (prevLibroId >= 1) navigate(`/leer/${prevLibroId}/1`)
    }
  }

  function irSiguiente() {
    const num = capActual?.numero || 1
    if (num < capitulos.length) irCapitulo(num + 1)
    else {
      const nextLibroId = parseInt(libroId) + 1
      if (nextLibroId <= 66) navigate(`/leer/${nextLibroId}/1`)
    }
  }

  function totalPalabras() {
    return versiculos.reduce((acc, v) => acc + (v.total_palabras || 0), 0)
  }

  if (!libro) return (
    <div className="reader">
      <div className="loading">
        <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
      </div>
    </div>
  )

  return (
    <div className="reader">
      {/* ─── CHAPTER NAV ─── */}
      <nav className="chapter-nav">
        <span className="chapter-nav-title">{libro.nombre}</span>
        {capitulos.map(cap => (
          <button
            key={cap.id}
            className={`cap-btn ${capActual?.numero === cap.numero ? 'active' : ''}`}
            onClick={() => irCapitulo(cap.numero)}
          >
            {cap.numero}
          </button>
        ))}
      </nav>

      {/* ─── BOOK INFO ─── */}
      <div className="book-info">
        {libro.autor_tradicional && (
          <div className="book-info-item">
            <span className="book-info-label">Autor</span>
            <span className="book-info-val">{libro.autor_tradicional}</span>
          </div>
        )}
        {libro.periodo_historico && (
          <div className="book-info-item">
            <span className="book-info-label">Período</span>
            <span className="book-info-val">{libro.periodo_historico}</span>
          </div>
        )}
        <div className="book-info-item">
          <span className="book-info-label">Idioma original</span>
          <span className="book-info-val">{libro.idioma_original}</span>
        </div>
        <div className="book-info-item">
          <span className="book-info-label">Capítulos</span>
          <span className="book-info-val">{libro.total_capitulos}</span>
        </div>
        <div className="book-info-item">
          <span className="book-info-label">Versículos</span>
          <span className="book-info-val">{libro.total_versiculos?.toLocaleString('es-CO')}</span>
        </div>
        <div className="book-info-item">
          <span className="book-info-label">Testamento</span>
          <span className="book-info-val">{libro.testamento}</span>
        </div>
      </div>

      {/* ─── VERSES ─── */}
      <div className="verse-area fade-in">
        <h1 className="verse-book-title">{libro.nombre}</h1>
        <div className="verse-chapter-label">
          Capítulo {capActual?.numero}
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
          </div>
        ) : (
          versiculos.map(v => (
            <div
              key={v.id}
              ref={el => verseRef.current[v.numero] = el}
              className={`verse ${highlighted === v.numero ? 'highlighted' : ''}`}
              onClick={() => setHighlighted(highlighted === v.numero ? null : v.numero)}
            >
              <span className="verse-num">{v.numero}</span>
              <span className="verse-text">{v.texto}</span>
            </div>
          ))
        )}

        {/* Navegación anterior/siguiente */}
        {!loading && (
          <div style={{ display: 'flex', gap: 12, marginTop: 48, paddingBottom: 40 }}>
            <button className="btn-secondary" onClick={irAnterior} style={{ fontSize: 11 }}>
              ← Anterior
            </button>
            <button className="btn-primary" onClick={irSiguiente} style={{ fontSize: 11 }}>
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="stats-bar">
        <div className="stat-item">
          <span>Libro</span>
          <strong>{libro.abreviatura}</strong>
        </div>
        <div className="stat-divider"/>
        <div className="stat-item">
          <span>Capítulo</span>
          <strong>{capActual?.numero} / {capitulos.length}</strong>
        </div>
        <div className="stat-divider"/>
        <div className="stat-item">
          <span>Versículos</span>
          <strong>{versiculos.length}</strong>
        </div>
        <div className="stat-divider"/>
        <div className="stat-item">
          <span>Palabras</span>
          <strong>{totalPalabras().toLocaleString('es-CO')}</strong>
        </div>
        {highlighted && (
          <>
            <div className="stat-divider"/>
            <div className="stat-item">
              <span>Seleccionado</span>
              <strong>{libro.abreviatura} {capActual?.numero}:{highlighted}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
