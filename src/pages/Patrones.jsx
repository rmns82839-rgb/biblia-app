import { useEffect, useState, useRef } from 'react'
import { getFrecuenciaPalabra, getTopPalabrasLibro, getTopPalabrasTestamento, getLibros } from '../lib/db.js'

// ─── COLORES POR TESTAMENTO / CATEGORÍA ─────────────────────
const COLORES_CAT = {
  'Pentateuco':          '#C9A84C',
  'Historia':            '#7EB8D4',
  'Poesía':              '#A78BFA',
  'Profetas Mayores':    '#E07070',
  'Profetas Menores':    '#FB923C',
  'Evangelios':          '#34D399',
  'Epístolas Paulinas':  '#60A5FA',
  'Epístolas Generales': '#818CF8',
  'Profecía':            '#F87171',
}

const COLOR_AT = '#C9A84C'
const COLOR_NT = '#60A5FA'

// ─── BARRA DE FRECUENCIA ─────────────────────────────────────
function BarraLibro({ libro, conteo, maxConteo, onClick }) {
  const pct  = maxConteo > 0 ? (conteo / maxConteo) * 100 : 0
  const color = COLORES_CAT[libro.categoria] || COLOR_AT

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Abreviatura */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color, width: 32, flexShrink: 0, textAlign: 'right' }}>
        {libro.abreviatura}
      </span>

      {/* Barra */}
      <div style={{ flex: 1, height: 18, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `${color}90`,
          borderRight: `2px solid ${color}`,
          borderRadius: 3,
          transition: 'width 0.4s ease',
          minWidth: conteo > 0 ? 4 : 0,
        }}/>
      </div>

      {/* Conteo */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, width: 40, flexShrink: 0 }}>
        {conteo}
      </span>
    </div>
  )
}

// ─── NUBE DE PALABRAS ────────────────────────────────────────
function NubePalabras({ palabras, onClickPalabra }) {
  if (!palabras.length) return null
  const maxConteo = Math.max(...palabras.map(p => Number(p.conteo)))
  const minConteo = Math.min(...palabras.map(p => Number(p.conteo)))

  function fontSize(conteo) {
    const n = Number(conteo)
    const ratio = maxConteo === minConteo ? 0.5 : (n - minConteo) / (maxConteo - minConteo)
    return 11 + ratio * 22  // 11px → 33px
  }

  function opacity(conteo) {
    const n = Number(conteo)
    const ratio = maxConteo === minConteo ? 0.5 : (n - minConteo) / (maxConteo - minConteo)
    return 0.5 + ratio * 0.5
  }

  const COLORES = ['#C9A84C', '#7EB8D4', '#A78BFA', '#34D399', '#FB923C', '#E07070', '#60A5FA']

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', lineHeight: 1.8,
    }}>
      {palabras.map((p, i) => (
        <span
          key={p.palabra}
          onClick={() => onClickPalabra(p.palabra)}
          title={`${p.palabra}: ${p.conteo} veces`}
          style={{
            fontFamily: 'var(--crimson)',
            fontSize: fontSize(p.conteo),
            color: COLORES[i % COLORES.length],
            opacity: opacity(p.conteo),
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: '0 4px',
          }}
          onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.target.style.opacity = opacity(p.conteo); e.target.style.transform = 'none' }}
        >
          {p.palabra}
        </span>
      ))}
    </div>
  )
}

// ─── RANKING DE PALABRAS ─────────────────────────────────────
function RankingPalabras({ palabras, onClickPalabra }) {
  if (!palabras.length) return null
  const max = Math.max(...palabras.map(p => Number(p.conteo)))
  const COLORES = ['#C9A84C', '#7EB8D4', '#A78BFA', '#34D399', '#FB923C', '#E07070']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {palabras.map((p, i) => {
        const pct = (Number(p.conteo) / max) * 100
        const color = COLORES[i % COLORES.length]
        return (
          <div
            key={p.palabra}
            onClick={() => onClickPalabra(p.palabra)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '3px 6px', borderRadius: 4, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>{i + 1}</span>
            <span style={{ fontFamily: 'var(--crimson)', fontSize: 16, color, width: 140, flexShrink: 0 }}>{p.palabra}</span>
            <div style={{ flex: 1, height: 14, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `${color}80`, borderRight: `2px solid ${color}`, transition: 'width 0.4s ease' }}/>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color, width: 36, textAlign: 'right' }}>{p.conteo}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAPA DE CALOR POR CAPÍTULOS ────────────────────────────
function MapaCalor({ capitulosData, termino }) {
  if (!capitulosData.length) return null

  // Agrupar por libro
  const porLibro = {}
  capitulosData.forEach(d => {
    if (!porLibro[d.libro]) porLibro[d.libro] = { abrev: d.abreviatura, caps: {} }
    porLibro[d.libro].caps[d.capitulo] = Number(d.conteo)
  })

  const maxConteo = Math.max(...capitulosData.map(d => Number(d.conteo)))

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        Distribución por capítulo — cada cuadro = 1 capítulo
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(porLibro).map(([libro, data]) => (
          <div key={libro} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {data.abrev}
            </span>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(data.caps).map(([cap, conteo]) => {
                const intensity = maxConteo > 0 ? conteo / maxConteo : 0
                const bg = `rgba(201,168,76,${0.1 + intensity * 0.9})`
                return (
                  <div
                    key={cap}
                    title={`${libro} ${cap}: ${conteo} veces`}
                    style={{ width: 14, height: 14, borderRadius: 2, background: bg, cursor: 'default' }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────
export default function Patrones() {
  const [libros, setLibros]             = useState([])
  const [vistaActiva, setVistaActiva]   = useState('frecuencia')  // 'frecuencia' | 'nube'

  // Vista frecuencia
  const [termino, setTermino]           = useState('')
  const [input, setInput]               = useState('')
  const [frecuencias, setFrecuencias]   = useState([])
  const [capitulosData, setCapitulosData] = useState([])
  const [loadingFrec, setLoadingFrec]   = useState(false)
  const [libroFiltro, setLibroFiltro]   = useState(null)

  // Vista nube
  const [libroNube, setLibroNube]       = useState('')
  const [testamentoNube, setTestNube]   = useState('Antiguo')
  const [palabrasNube, setPalabrasNube] = useState([])
  const [modoNube, setModoNube]         = useState('nube')  // 'nube' | 'ranking'
  const [loadingNube, setLoadingNube]   = useState(false)

  useEffect(() => {
    getLibros().then(setLibros).catch(console.error)
  }, [])

  // ─── Búsqueda de frecuencia ──────────────────────────────
  async function buscarFrecuencia(t) {
    if (!t.trim()) return
    setTermino(t.trim())
    setLoadingFrec(true)
    setCapitulosData([])
    setLibroFiltro(null)
    try {
      const [freq, caps] = await Promise.all([
        getFrecuenciaPalabra(t.trim()),
        getPalabraEnLibros ? getPalabraEnLibros(t.trim()) : Promise.resolve([]),
      ])
      setFrecuencias(freq)
      setCapitulosData(caps || [])
    } catch(e) {
      console.error(e)
    }
    setLoadingFrec(false)
  }

  // Importar función adicional
  const [getPalabraEnLibros, setGetPalabraEnLibros] = useState(null)
  useEffect(() => {
    import('../lib/db.js').then(m => {
      setGetPalabraEnLibros(() => m.getPalabraEnLibros)
    })
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim()) buscarFrecuencia(input.trim())
  }

  // ─── Nube de palabras ────────────────────────────────────
  useEffect(() => {
    if (vistaActiva !== 'nube') return
    setLoadingNube(true)
    setPalabrasNube([])
    const fn = libroNube
      ? getTopPalabrasLibro(libroNube, 40)
      : getTopPalabrasTestamento(testamentoNube, 40)
    fn.then(p => { setPalabrasNube(p); setLoadingNube(false) })
      .catch(() => setLoadingNube(false))
  }, [vistaActiva, libroNube, testamentoNube])

  // Stats de frecuencia
  const totalOcurrencias = frecuencias.reduce((a, f) => a + Number(f.conteo), 0)
  const librosConPalabra = frecuencias.length
  const maxConteo = frecuencias.length ? Math.max(...frecuencias.map(f => Number(f.conteo))) : 1

  // Filtrar por testamento si hay selección
  const frecsAT = frecuencias.filter(f => f.testamento === 'Antiguo')
  const frecsNT = frecuencias.filter(f => f.testamento === 'Nuevo')
  const frecsVisible = libroFiltro
    ? frecuencias.filter(f => f.abreviatura === libroFiltro)
    : frecuencias

  return (
    <main style={{ flex: 1, padding: '32px 40px 80px', maxWidth: 900, minWidth: 0 }}>

      {/* ─── HEADER ─── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', marginBottom: 6, fontWeight: 300 }}>
          Patrones Bíblicos
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Analiza la frecuencia y distribución de palabras en los 66 libros de la Biblia RV1960.
        </p>
      </div>

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--surface2)', padding: 4, borderRadius: 6, width: 'fit-content' }}>
        {[
          { key: 'frecuencia', label: '🔍 Frecuencia de palabras' },
          { key: 'nube',       label: '☁️ Nube de palabras' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setVistaActiva(tab.key)}
            style={{
              fontFamily: 'var(--mono)', fontSize: 11,
              padding: '8px 18px', borderRadius: 4, border: 'none',
              background: vistaActiva === tab.key ? 'var(--gold)' : 'none',
              color: vistaActiva === tab.key ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: vistaActiva === tab.key ? 700 : 400,
              transition: 'all 0.2s', letterSpacing: '0.04em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* VISTA 1 — FRECUENCIA */}
      {/* ══════════════════════════════════════════════════════ */}
      {vistaActiva === 'frecuencia' && (
        <div>
          {/* Búsqueda */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              className="search-input-lg"
              type="text"
              placeholder='Ej: amor, Jehová, gracia, sangre, gloria...'
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn-primary" type="submit" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
              Analizar
            </button>
          </form>

          {/* Palabras sugeridas */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', alignSelf: 'center' }}>SUGERIDAS:</span>
            {['Jehová', 'amor', 'gracia', 'gloria', 'sangre', 'pecado', 'salvación', 'vida', 'muerte', 'ángel', 'profeta', 'tierra', 'cielo', 'rey', 'pueblo'].map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); buscarFrecuencia(s) }}
                style={{
                  fontFamily: 'var(--crimson)', fontSize: 15,
                  color: 'var(--text-muted)', background: 'none',
                  border: '1px solid var(--border)', borderRadius: 4,
                  padding: '3px 10px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.color = 'var(--gold)'; e.target.style.borderColor = 'var(--gold)' }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--border)' }}
              >
                {s}
              </button>
            ))}
          </div>

          {loadingFrec && (
            <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>
          )}

          {!loadingFrec && termino && frecuencias.length > 0 && (
            <>
              {/* Stats resumen */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Ocurrencias totales', valor: totalOcurrencias.toLocaleString('es-CO'), color: 'var(--gold)' },
                  { label: 'Libros donde aparece', valor: `${librosConPalabra} / 66`, color: 'var(--green-light)' },
                  { label: 'Libro con más ocurrencias', valor: frecuencias[0]?.libro || '-', color: '#A78BFA' },
                  { label: 'Máximo en un libro', valor: maxConteo.toLocaleString('es-CO'), color: '#FB923C' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', minWidth: 140 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--crimson)', fontSize: 22, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                  </div>
                ))}
              </div>

              {/* Filtros AT / NT */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FILTRAR:</span>
                {[
                  { label: 'Toda la Biblia', val: null },
                  { label: `AT (${frecsAT.reduce((a,f)=>a+Number(f.conteo),0)})`, val: 'AT' },
                  { label: `NT (${frecsNT.reduce((a,f)=>a+Number(f.conteo),0)})`, val: 'NT' },
                ].map(f => (
                  <button
                    key={f.label}
                    onClick={() => setLibroFiltro(f.val)}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 12px',
                      borderRadius: 4, border: `1px solid ${libroFiltro === f.val ? 'var(--gold)' : 'var(--border2)'}`,
                      background: libroFiltro === f.val ? 'var(--gold-glow)' : 'none',
                      color: libroFiltro === f.val ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Gráfico de barras — AT */}
              {(libroFiltro === null || libroFiltro === 'AT') && frecsAT.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: COLOR_AT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_AT, display: 'inline-block' }}/>
                    Antiguo Testamento — {frecsAT.reduce((a,f)=>a+Number(f.conteo),0).toLocaleString('es-CO')} ocurrencias
                  </div>
                  {frecsAT.map(f => (
                    <BarraLibro key={f.abreviatura} libro={f} conteo={Number(f.conteo)} maxConteo={maxConteo} onClick={() => {}} />
                  ))}
                </div>
              )}

              {/* Gráfico de barras — NT */}
              {(libroFiltro === null || libroFiltro === 'NT') && frecsNT.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: COLOR_NT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_NT, display: 'inline-block' }}/>
                    Nuevo Testamento — {frecsNT.reduce((a,f)=>a+Number(f.conteo),0).toLocaleString('es-CO')} ocurrencias
                  </div>
                  {frecsNT.map(f => (
                    <BarraLibro key={f.abreviatura} libro={f} conteo={Number(f.conteo)} maxConteo={maxConteo} onClick={() => {}} />
                  ))}
                </div>
              )}

              {/* Mapa de calor por capítulos */}
              {capitulosData.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', marginTop: 8 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Mapa de calor — distribución por capítulos
                  </div>
                  <MapaCalor capitulosData={capitulosData} termino={termino} />
                </div>
              )}
            </>
          )}

          {!loadingFrec && termino && frecuencias.length === 0 && (
            <div className="empty">
              «{termino}» no aparece en la tabla de frecuencias<br/>
              <span style={{ fontSize: 11 }}>Intenta con otra forma de la palabra</span>
            </div>
          )}

          {!termino && (
            <div className="empty" style={{ padding: 40 }}>
              Escribe una palabra para ver su distribución en los 66 libros
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* VISTA 2 — NUBE DE PALABRAS */}
      {/* ══════════════════════════════════════════════════════ */}
      {vistaActiva === 'nube' && (
        <div>
          {/* Controles */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Selector libro */}
            <select
              className="search-select"
              value={libroNube}
              onChange={e => setLibroNube(e.target.value)}
            >
              <option value="">Por testamento</option>
              <option value="" disabled>── Antiguo Testamento ──</option>
              {libros.filter(l => l.testamento === 'Antiguo').map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
              <option value="" disabled>── Nuevo Testamento ──</option>
              {libros.filter(l => l.testamento === 'Nuevo').map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>

            {/* Si no hay libro, selector de testamento */}
            {!libroNube && (
              <div style={{ display: 'flex', gap: 4 }}>
                {['Antiguo', 'Nuevo'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTestNube(t)}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 10,
                      padding: '8px 14px', borderRadius: 4,
                      border: `1px solid ${testamentoNube === t ? 'var(--gold)' : 'var(--border2)'}`,
                      background: testamentoNube === t ? 'var(--gold-glow)' : 'none',
                      color: testamentoNube === t ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {t} Testamento
                  </button>
                ))}
              </div>
            )}

            {/* Modo de visualización */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[
                { key: 'nube',    label: '☁️ Nube' },
                { key: 'ranking', label: '📊 Ranking' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setModoNube(m.key)}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: 10,
                    padding: '7px 14px', borderRadius: 4,
                    border: `1px solid ${modoNube === m.key ? 'var(--gold)' : 'var(--border2)'}`,
                    background: modoNube === m.key ? 'var(--gold-glow)' : 'none',
                    color: modoNube === m.key ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            {libroNube
              ? `Top 40 palabras — ${libros.find(l => String(l.id) === String(libroNube))?.nombre}`
              : `Top 40 palabras — ${testamentoNube} Testamento`
            }
            {palabrasNube.length > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
                · Click en una palabra para analizarla
              </span>
            )}
          </div>

          {loadingNube && (
            <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>
          )}

          {/* Nube o Ranking */}
          {!loadingNube && palabrasNube.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', minHeight: 200 }}>
              {modoNube === 'nube'
                ? <NubePalabras
                    palabras={palabrasNube}
                    onClickPalabra={p => { setInput(p); setVistaActiva('frecuencia'); buscarFrecuencia(p) }}
                  />
                : <div style={{ padding: '12px 8px' }}>
                    <RankingPalabras
                      palabras={palabrasNube}
                      onClickPalabra={p => { setInput(p); setVistaActiva('frecuencia'); buscarFrecuencia(p) }}
                    />
                  </div>
              }
            </div>
          )}

          <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            * Se excluyen palabras de menos de 4 caracteres. Click en cualquier palabra para ver su análisis completo.
          </div>
        </div>
      )}
    </main>
  )
}