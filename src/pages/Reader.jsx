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

// ─── ACORDEÓN DE CAPÍTULO ────────────────────────────────────
function CapituloAcordeon({ cap, libroId, opciones, isOpen, onToggle }) {
  const [versiculos, setVersiculos]   = useState([])
  const [especiales, setEspeciales]   = useState({})
  const [contadores, setContadores]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [highlighted, setHighlighted] = useState(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (!isOpen || loaded.current) return
    loaded.current = true
    setLoading(true)
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
    }).catch(console.error)
  }, [isOpen])

  function getVerseBg(v) {
    const esp = especiales[v.numero]
    if (!esp) return ''
    if (esp.tipo_jesus) return 'rgba(224,112,112,0.05)'
    if (esp.tema_mesianico) return 'rgba(251,146,60,0.05)'
    if (esp.estado_juicio === 'cumplido') return 'rgba(52,211,153,0.05)'
    if (esp.estado_juicio === 'por_cumplirse') return 'rgba(248,113,113,0.05)'
    if (esp.estado_juicio === 'cumplimiento_parcial') return 'rgba(251,191,36,0.05)'
    return ''
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* ─── HEADER DEL CAPÍTULO ─── */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 48px', cursor: 'pointer',
          background: isOpen ? 'rgba(201,168,76,0.04)' : 'transparent',
          transition: 'background 0.15s',
          userSelect: 'none',
        }}
      >
        {/* Número */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `1px solid ${isOpen ? 'var(--gold)' : 'var(--border2)'}`,
          background: isOpen ? 'var(--gold)' : 'transparent',
          color: isOpen ? 'var(--bg)' : 'var(--text-muted)',
          fontFamily: 'var(--mono)', fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.2s',
        }}>
          {cap.numero}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: isOpen ? 'var(--gold)' : 'var(--text-dim)' }}>
            Capítulo {cap.numero}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 2 }}>
            {cap.total_versiculos} versículos · {cap.total_palabras?.toLocaleString('es-CO')} palabras
          </div>
        </div>

        {/* Contadores especiales (si ya cargó) */}
        {contadores && (
          <div style={{ display: 'flex', gap: 8 }}>
            {Number(contadores.palabras_jesus) > 0 && (
              <span title="Palabras de Jesús" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#E07070' }}>
                🔴 {contadores.palabras_jesus}
              </span>
            )}
            {Number(contadores.profecias_mesianicas) > 0 && (
              <span title="Profecías mesiánicas" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#FB923C' }}>
                🟠 {contadores.profecias_mesianicas}
              </span>
            )}
            {Number(contadores.juicios_cumplidos) > 0 && (
              <span title="Juicios cumplidos" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#34D399' }}>
                ✅ {contadores.juicios_cumplidos}
              </span>
            )}
            {Number(contadores.juicios_por_cumplir) > 0 && (
              <span title="Juicios por cumplirse" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171' }}>
                ⏳ {contadores.juicios_por_cumplir}
              </span>
            )}
          </div>
        )}

        {/* Chevron */}
        <div style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
          ▶
        </div>
      </div>

      {/* ─── VERSÍCULOS DESPLEGADOS ─── */}
      {isOpen && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          {loading ? (
            <div className="loading" style={{ padding: 32 }}>
              <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
            </div>
          ) : (
            <div style={{ padding: '16px 48px 24px' }}>
              {versiculos.map(v => {
                const esp = especiales[v.numero]
                const isSel = highlighted === v.numero
                return (
                  <div key={v.id}>
                    <div
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
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── READER PRINCIPAL ────────────────────────────────────────
export default function Reader() {
  const { libroId } = useParams()
  const navigate    = useNavigate()

  const [libro, setLibro]         = useState(null)
  const [capitulos, setCapitulos] = useState([])
  const [abiertos, setAbiertos]   = useState({})   // capituloId → bool
  const [opciones, setOpciones]   = useState({
    dios: true, jesus: true, angeles: true,
    numeros: true, profecias: true,
  })

  useEffect(() => {
    if (!libroId) return
    Promise.all([getLibro(libroId), getCapitulos(libroId)])
      .then(([lib, caps]) => {
        setLibro(lib)
        setCapitulos(caps)
        // Abrir capítulo 1 por defecto
        if (caps.length) setAbiertos({ [caps[0].id]: true })
      })
      .catch(console.error)
  }, [libroId])

  function toggleCap(capId) {
    setAbiertos(prev => ({ ...prev, [capId]: !prev[capId] }))
  }

  function toggleOpcion(key) {
    setOpciones(prev => ({ ...prev, [key]: !prev[key] }))
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
      {/* ─── HEADER DEL LIBRO ─── */}
      <div style={{ padding: '24px 48px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <h1 className="verse-book-title" style={{ marginBottom: 8 }}>{libro.nombre}</h1>

        {/* Metadata */}
        <div className="book-info" style={{ margin: 0, border: 'none', padding: 0, background: 'transparent' }}>
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
            <span className="book-info-label">Idioma</span>
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
        </div>

        {/* Controles de resaltado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Resaltados:
          </span>
          {[
            { key: 'dios',      label: 'Nombres de Dios',  color: '#C9A84C' },
            { key: 'jesus',     label: 'Jesús / Mesías',   color: '#E07070' },
            { key: 'angeles',   label: 'Ángeles',           color: '#7EB8D4' },
            { key: 'numeros',   label: 'Números bíblicos', color: '#A78BFA' },
            { key: 'profecias', label: 'Términos prof.',   color: '#6AAF7E' },
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

          {/* Expandir/colapsar todos */}
          <button
            onClick={() => {
              const todosAbiertos = capitulos.every(c => abiertos[c.id])
              const nuevo = {}
              capitulos.forEach(c => { nuevo[c.id] = !todosAbiertos })
              setAbiertos(nuevo)
            }}
            style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border2)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            {capitulos.every(c => abiertos[c.id]) ? '▲ Colapsar todo' : '▼ Expandir todo'}
          </button>
        </div>
      </div>

      {/* ─── LEYENDA ─── */}
      <div style={{ padding: '10px 48px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Leyenda:</span>
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
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: l.color, letterSpacing: '0.04em' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ─── ACORDEÓN DE CAPÍTULOS ─── */}
      <div style={{ paddingBottom: 60 }}>
        {capitulos.map(cap => (
          <CapituloAcordeon
            key={cap.id}
            cap={cap}
            libroId={libroId}
            opciones={opciones}
            isOpen={!!abiertos[cap.id]}
            onToggle={() => toggleCap(cap.id)}
          />
        ))}
      </div>
    </div>
  )
}