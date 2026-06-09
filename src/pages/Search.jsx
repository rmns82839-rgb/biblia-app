import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { buscarVersiculos, contarPalabra, getLibros } from '../lib/db.js'

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [query, setQuery]       = useState(searchParams.get('q') || '')
  const [input, setInput]       = useState(searchParams.get('q') || '')
  const [libros, setLibros]     = useState([])
  const [libroFiltro, setLibroFiltro] = useState('')
  const [resultados, setResultados]   = useState([])
  const [frecuencias, setFrecuencias] = useState([])
  const [loading, setLoading]   = useState(false)
  const [limite, setLimite]     = useState(50)

  useEffect(() => {
    getLibros().then(setLibros).catch(console.error)
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); setInput(q) }
  }, [searchParams])

  useEffect(() => {
    if (!query.trim()) { setResultados([]); setFrecuencias([]); return }
    setLoading(true)
    Promise.all([
      buscarVersiculos(query, libroFiltro || null, limite),
      !libroFiltro ? contarPalabra(query) : Promise.resolve([])
    ])
      .then(([res, freq]) => {
        setResultados(res)
        setFrecuencias(freq)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [query, libroFiltro, limite])

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim()) {
      setQuery(input.trim())
      navigate(`/buscar?q=${encodeURIComponent(input.trim())}`)
    }
  }

  function highlight(texto, term) {
    if (!term) return texto
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = texto.split(re)
    return parts.map((part, i) =>
      re.test(part) ? <mark key={i}>{part}</mark> : part
    )
  }

  const totalOcurrencias = frecuencias.reduce((acc, f) => acc + Number(f.conteo), 0)

  return (
    <main className="search-page fade-in">
      <div className="search-header">
        <h1 className="search-title">Buscador</h1>
        <form onSubmit={handleSubmit} className="search-controls">
          <input
            className="search-input-lg"
            type="text"
            placeholder='Ej: amor, Jehová, "no temas"...'
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <select
            className="search-select"
            value={libroFiltro}
            onChange={e => setLibroFiltro(e.target.value)}
          >
            <option value="">Toda la Biblia</option>
            <option value="" disabled>── Antiguo Testamento ──</option>
            {libros.filter(l => l.testamento === 'Antiguo').map(l => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
            <option value="" disabled>── Nuevo Testamento ──</option>
            {libros.filter(l => l.testamento === 'Nuevo').map(l => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
          <select
            className="search-select"
            value={limite}
            onChange={e => setLimite(Number(e.target.value))}
          >
            <option value={50}>50 resultados</option>
            <option value={100}>100 resultados</option>
            <option value={500}>500 resultados</option>
            <option value={9999}>Todos</option>
          </select>
          <button className="btn-primary" type="submit">Buscar</button>
        </form>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
        </div>
      )}

      {!loading && query && resultados.length > 0 && (
        <>
          <p className="search-meta">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para «{query}»
            {!libroFiltro && totalOcurrencias > 0 && ` · ${totalOcurrencias.toLocaleString('es-CO')} ocurrencias totales`}
          </p>

          {/* Frecuencias por libro */}
          {!libroFiltro && frecuencias.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Aparece en {frecuencias.length} libro{frecuencias.length !== 1 ? 's' : ''}
              </div>
              <div className="freq-grid">
                {frecuencias.slice(0, 20).map(f => (
                  <div
                    key={f.abreviatura}
                    className="freq-card"
                    onClick={() => setLibroFiltro(String(
                      libros.find(l => l.abreviatura === f.abreviatura)?.id || ''
                    ))}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="freq-book">{f.libro}</div>
                    <div className="freq-count">{f.conteo}</div>
                    <div className="freq-label">veces</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados */}
          <div>
            {resultados.map(r => (
              <div
                key={r.id}
                className="search-result"
                onClick={() => navigate(`/leer/${libros.find(l => l.nombre === r.libro)?.id || 1}/${r.capitulo}`)}
              >
                <div className="search-result-ref">{r.referencia} · {r.libro}</div>
                <div className="search-result-text">
                  {highlight(r.texto, query)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && query && resultados.length === 0 && (
        <div className="empty">
          Sin resultados para «{query}»<br/>
          <span style={{ fontSize: 11 }}>Intenta con otra palabra o revisa la ortografía</span>
        </div>
      )}

      {!query && (
        <div className="empty">
          Escribe una palabra o frase para buscar en los 29,566 versículos
        </div>
      )}
    </main>
  )
}
