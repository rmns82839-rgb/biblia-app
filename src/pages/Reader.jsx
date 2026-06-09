import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLibro, getCapitulos, getVersiculos, getEspecialesPorCapitulo, getContadorEspeciales } from '../lib/db.js'
import { resaltarTexto } from '../lib/resaltador.js'

const ESTILOS_RESALTADO = {
  dios:     { color: '#C9A84C', fontWeight: '500', title: 'Nombre de Dios' },
  jesus:    { color: '#E07070', fontWeight: '500', title: 'Nombre de Jesús / Mesías' },
  angel:    { color: '#7EB8D4', fontWeight: '400', title: 'Ángel / Ser celestial' },
  numero:   { color: '#A78BFA', fontWeight: '400', title: 'Número bíblico significativo' },
  profecia: { color: '#6AAF7E', fontWeight: '400', title: 'Término profético' },
}

const TIPO_JESUS_LABEL = {
  directo:    'Palabras de Jesús',
  parábola:   'Parábola de Jesús',
  oración:    'Oración de Jesús',
  resucitado: 'Jesús resucitado',
}

function VersoTexto({ texto, opciones }) {
  const segmentos = resaltarTexto(texto, opciones)
  return (
    <span className="verse-text">
      {segmentos.map((seg, i) => {
        if (!seg.tipo) return <span key={i}>{seg.texto}</span>
        const est = ESTILOS_RESALTADO[seg.tipo]
        return (
          <span key={i} style={{ color: est.color, fontWeight: est.fontWeight }} title={est.title}>
            {seg.texto}
          </span>
        )
      })}
    </span>
  )
}

function VerseIndicators({ especial }) {
  if (!especial) return null
  const items = []
  if (especial.tipo_jesus)    items.push({ color: '#E07070' })
  if (especial.tema_mesianico) items.push({ color: '#FB923C' })
  if (especial.estado_juicio === 'cumplido')            items.push({ color: '#34D399' })
  if (especial.estado_juicio === 'por_cumplirse')       items.push({ color: '#F87171' })
  if (especial.estado_juicio === 'cumplimiento_parcial') items.push({ color: '#FBBF24' })
  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, flexShrink: 0 }}>
      {items.map((it, i) => (
        <div key={i} style={{ width: 4, height: 14, borderRadius: 2, background: it.color }} />
      ))}
    </div>
  )
}

function VerseTooltip({ especial }) {
  if (!especial) return null
  const items = []
  if (especial.tipo_jesus) items.push({ icon: '🔴', color: '#E07070', titulo: TIPO_JESUS_LABEL[especial.tipo_jesus] || 'Palabras de Jesús', desc: null })
  if (especial.tema_mesianico) items.push({ icon: '🟠', color: '#FB923C', titulo: 'Profecía mesiánica', desc: especial.tema_mesianico })
  if (especial.estado_juicio) {
    const ji = {
      cumplido:             { icon: '✅', color: '#34D399', titulo: 'Juicio cumplido' },
      por_cumplirse:        { icon: '⏳', color: '#F87171', titulo: 'Juicio por cumplirse' },
      cumplimiento_parcial: { icon: '🔶', color: '#FBBF24', titulo: 'Cumplimiento parcial' },
    }[especial.estado_juicio]
    items.push({ ...ji, desc: especial.juicio_descripcion || especial.juicio_sobre })
  }
  if (!items.length) return null
  return (
    <div style={{ margin: '4px 0 8px 36px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: `${it.color}10`, border: `1px solid ${it.color}30`, borderRadius: 4, padding: '6px 10px' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>{it.icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: it.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{it.titulo}</div>
            {it.desc && <div style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{it.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Reader() {
  const { libroId, capituloNum } = useParams()
  const navigate = useNavigate()

  const [libro, setLibro]           = useState(null)
  const [capitulos, setCapitulos]   = useState([])
  const [versiculos, setVersiculos] = useState([])
  const [capActual, setCapActual]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [highlighted, setHighlighted] = useState(null)
  const [especiales, setEspeciales] = useState({})
  const [contadores, setContadores] = useState(null)
  const [showIndice, setShowIndice] = useState(false)
  const [opciones, setOpciones]     = useState({
    dios: true, jesus: true, angeles: true,
    numeros: true, profecias: true,
  })
  const verseRefs = useRef({})

  // Cargar libro
  useEffect(() => {
    if (!libroId) return
    setLoading(true)
    Promise.all([getLibro(libroId), getCapitulos(libroId)])
      .then(([lib, caps]) => { setLibro(lib); setCapitulos(caps) })
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
    setEspeciales({})
    setContadores(null)
    setHighlighted(null)
    Promise.all([
      getVersiculos(cap.id),
      getEspecialesPorCapitulo(cap.id),
      getContadorEspeciales(cap.id),
    ]).then(([vers, esp, cont]) => {
      setVersiculos(vers)
      const espMap = {}
      esp.forEach(e => { espMap[e.numero] = e })
      setEspeciales(espMap)
      setContadores(cont)
      setLoading(false)
      // Scroll al inicio del capítulo
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }).catch(console.error)
  }, [capitulos, capituloNum])

  function irCapitulo(num) {
    navigate(`/leer/${libroId}/${num}`)
  }

  function irAnterior() {
    const num = capActual?.numero || 1
    if (num > 1) irCapitulo(num - 1)
    else { const p = parseInt(libroId) - 1; if (p >= 1) navigate(`/leer/${p}/1`) }
  }

  function irSiguiente() {
    const num = capActual?.numero || 1
    if (num < capitulos.length) irCapitulo(num + 1)
    else { const n = parseInt(libroId) + 1; if (n <= 66) navigate(`/leer/${n}/1`) }
  }

  // Saltar a versículo específico
  function saltarAVersiculo(numVers) {
    setShowIndice(false)
    // Dar tiempo para que se cierre el índice y luego hacer scroll
    setTimeout(() => {
      const el = verseRefs.current[numVers]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlighted(numVers)
      }
    }, 50)
  }

  function totalPalabras() {
    return versiculos.reduce((acc, v) => acc + (v.total_palabras || 0), 0)
  }

  function toggleOpcion(key) {
    setOpciones(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function getVerseBg(v) {
    const esp = especiales[v.numero]
    if (!esp) return ''
    if (esp.tipo_jesus) return 'rgba(224,112,112,0.04)'
    if (esp.tema_mesianico) return 'rgba(251,146,60,0.04)'
    if (esp.estado_juicio === 'cumplido') return 'rgba(52,211,153,0.04)'
    if (esp.estado_juicio === 'por_cumplirse') return 'rgba(248,113,113,0.04)'
    return ''
  }

  // Color del número en el índice según si tiene especiales
  function colorVersiculo(num) {
    const esp = especiales[num]
    if (!esp) return 'var(--text-muted)'
    if (esp.tipo_jesus) return '#E07070'
    if (esp.tema_mesianico) return '#FB923C'
    if (esp.estado_juicio === 'cumplido') return '#34D399'
    if (esp.estado_juicio === 'por_cumplirse') return '#F87171'
    return 'var(--gold)'
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

      {/* ─── VERSE AREA ─── */}
      <div className="verse-area fade-in">
        <h1 className="verse-book-title">{libro.nombre}</h1>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Botón índice de versículos */}
          <button
            onClick={() => setShowIndice(!showIndice)}
            style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              padding: '5px 12px', borderRadius: 4,
              border: `1px solid ${showIndice ? 'var(--gold)' : 'var(--border2)'}`,
              background: showIndice ? 'var(--gold-glow)' : 'none',
              color: showIndice ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em',
            }}
          >
            # Versículos
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--border2)' }}/>

          {/* Resaltados */}
          {[
            { key: 'dios',      label: 'Dios',    color: '#C9A84C' },
            { key: 'jesus',     label: 'Jesús',   color: '#E07070' },
            { key: 'angeles',   label: 'Ángeles', color: '#7EB8D4' },
            { key: 'numeros',   label: 'Números', color: '#A78BFA' },
            { key: 'profecias', label: 'Profec.', color: '#6AAF7E' },
          ].map(op => (
            <button key={op.key} onClick={() => toggleOpcion(op.key)} style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              padding: '4px 10px', borderRadius: 4,
              border: `1px solid ${opciones[op.key] ? op.color : 'var(--border2)'}`,
              background: opciones[op.key] ? `${op.color}18` : 'none',
              color: opciones[op.key] ? op.color : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em',
            }}>
              {opciones[op.key] ? '●' : '○'} {op.label}
            </button>
          ))}
        </div>

        {/* ─── ÍNDICE DE VERSÍCULOS ─── */}
        {showIndice && !loading && versiculos.length > 0 && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: 24,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              {libro.abreviatura} {capActual?.numero} — {versiculos.length} versículos
              <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
                · Los colores indican tipo de versículo
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {versiculos.map(v => (
                <button
                  key={v.numero}
                  onClick={() => saltarAVersiculo(v.numero)}
                  title={`Ir al versículo ${v.numero}`}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 4,
                    border: `1px solid ${highlighted === v.numero ? colorVersiculo(v.numero) : 'var(--border2)'}`,
                    background: highlighted === v.numero ? `${colorVersiculo(v.numero)}20` : 'var(--surface2)',
                    color: colorVersiculo(v.numero),
                    fontFamily: 'var(--mono)', fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = colorVersiculo(v.numero)
                    e.currentTarget.style.background = `${colorVersiculo(v.numero)}20`
                  }}
                  onMouseLeave={e => {
                    if (highlighted !== v.numero) {
                      e.currentTarget.style.borderColor = 'var(--border2)'
                      e.currentTarget.style.background = 'var(--surface2)'
                    }
                  }}
                >
                  {v.numero}
                </button>
              ))}
            </div>

            {/* Leyenda del índice */}
            <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: 'var(--text-muted)', label: 'Normal' },
                { color: '#E07070', label: 'Palabras de Jesús' },
                { color: '#FB923C', label: 'Profecía mesiánica' },
                { color: '#34D399', label: 'Juicio cumplido' },
                { color: '#F87171', label: 'Juicio pendiente' },
                { color: 'var(--gold)', label: 'Otro especial' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }}/>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contadores especiales */}
        {contadores && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Number(contadores.palabras_jesus) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontSize: 12 }}>🔴</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#E07070' }}>{contadores.palabras_jesus} vers. Jesús</span>
              </div>
            )}
            {Number(contadores.profecias_mesianicas) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontSize: 12 }}>🟠</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#FB923C' }}>{contadores.profecias_mesianicas} prof. mesiánicas</span>
              </div>
            )}
            {Number(contadores.juicios_cumplidos) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontSize: 12 }}>✅</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#34D399' }}>{contadores.juicios_cumplidos} juicios cumplidos</span>
              </div>
            )}
            {Number(contadores.juicios_por_cumplir) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontSize: 12 }}>⏳</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171' }}>{contadores.juicios_por_cumplir} juicios pendientes</span>
              </div>
            )}
          </div>
        )}

        <div className="verse-chapter-label">Capítulo {capActual?.numero}</div>

        {loading ? (
          <div className="loading">
            <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
          </div>
        ) : (
          versiculos.map(v => {
            const esp = especiales[v.numero]
            const isSel = highlighted === v.numero
            return (
              <div key={v.id}>
                <div
                  ref={el => verseRefs.current[v.numero] = el}
                  className={`verse ${isSel ? 'highlighted' : ''}`}
                  style={{ background: isSel ? undefined : getVerseBg(v) }}
                  onClick={() => setHighlighted(isSel ? null : v.numero)}
                >
                  <span className="verse-num">{v.numero}</span>
                  <VersoTexto texto={v.texto} opciones={opciones} />
                  <VerseIndicators especial={esp} />
                </div>
                {isSel && esp && <VerseTooltip especial={esp} />}
              </div>
            )
          })
        )}

        {/* Leyenda */}
        {!loading && (
          <div style={{ marginTop: 32, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Leyenda</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {[
                { color: '#C9A84C', label: 'Nombres de Dios' },
                { color: '#E07070', label: 'Palabras de Jesús' },
                { color: '#7EB8D4', label: 'Ángeles' },
                { color: '#A78BFA', label: 'Números bíblicos' },
                { color: '#6AAF7E', label: 'Términos proféticos' },
                { color: '#FB923C', label: 'Profecía mesiánica' },
                { color: '#34D399', label: 'Juicio cumplido' },
                { color: '#F87171', label: 'Juicio pendiente' },
                { color: '#FBBF24', label: 'Cumpl. parcial' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }}/>
                  <span style={{ fontFamily: 'var(--crimson)', fontSize: 13, color: l.color }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navegación */}
        {!loading && (
          <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingBottom: 40 }}>
            <button className="btn-secondary" onClick={irAnterior} style={{ fontSize: 11 }}>← Anterior</button>
            <button className="btn-primary"   onClick={irSiguiente} style={{ fontSize: 11 }}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="stats-bar">
        <div className="stat-item"><span>Libro</span><strong>{libro.abreviatura}</strong></div>
        <div className="stat-divider"/>
        <div className="stat-item"><span>Capítulo</span><strong>{capActual?.numero} / {capitulos.length}</strong></div>
        <div className="stat-divider"/>
        <div className="stat-item"><span>Versículos</span><strong>{versiculos.length}</strong></div>
        <div className="stat-divider"/>
        <div className="stat-item"><span>Palabras</span><strong>{totalPalabras().toLocaleString('es-CO')}</strong></div>
        {contadores && Number(contadores.palabras_jesus) > 0 && (
          <><div className="stat-divider"/>
          <div className="stat-item"><span style={{ color: '#E07070' }}>🔴 Jesús</span><strong style={{ color: '#E07070' }}>{contadores.palabras_jesus}</strong></div></>
        )}
        {contadores && Number(contadores.profecias_mesianicas) > 0 && (
          <><div className="stat-divider"/>
          <div className="stat-item"><span style={{ color: '#FB923C' }}>🟠 Mesías</span><strong style={{ color: '#FB923C' }}>{contadores.profecias_mesianicas}</strong></div></>
        )}
        {highlighted && (
          <><div className="stat-divider"/>
          <div className="stat-item"><span>Versículo</span><strong>{libro.abreviatura} {capActual?.numero}:{highlighted}</strong></div></>
        )}
      </div>
    </div>
  )
}