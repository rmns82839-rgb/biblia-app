import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

// ─── QUERIES ────────────────────────────────────────────────
const queries = {
  nombres: () => sql`
    SELECT n.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_nombres n
    LEFT JOIN versiculos v ON n.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY n.categoria, n.id`,

  obras: () => sql`
    SELECT o.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_obras o
    LEFT JOIN versiculos v ON o.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY o.etapa, o.id`,

  simbolos: () => sql`
    SELECT s.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_simbolos s
    LEFT JOIN versiculos v ON s.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY s.id`,

  dones: () => sql`
    SELECT d.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_dones d
    LEFT JOIN versiculos v ON d.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY d.categoria, d.id`,

  fruto: () => sql`
    SELECT f.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_fruto f
    LEFT JOIN versiculos v ON f.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY f.id`,

  porLibro: () => sql`
    SELECT p.*, v.texto AS texto_vers, l.id AS libro_id, c.numero AS cap_num
    FROM espiritusanto_por_libro p
    LEFT JOIN versiculos v ON p.versiculo_id = v.id
    LEFT JOIN capitulos  c ON v.capitulo_id  = c.id
    LEFT JOIN libros     l ON v.libro_id     = l.id
    ORDER BY l.orden`,
}

// ─── COLORES ─────────────────────────────────────────────────
const COLOR_CAT = {
  divino:          '#C9A84C',
  relacional:      '#60A5FA',
  funcional:       '#34D399',
  profético:       '#FB923C',
  soteriológico:   '#A78BFA',
}

const COLOR_ETAPA = {
  creacion:    { color: '#C9A84C', icon: '🌌', label: 'En la Creación' },
  AT:          { color: '#FB923C', icon: '📜', label: 'En el Antiguo Testamento' },
  vida_jesus:  { color: '#60A5FA', icon: '✦',  label: 'En la Vida de Jesús' },
  pentecostes: { color: '#F87171', icon: '🔥', label: 'En Pentecostés' },
  iglesia:     { color: '#34D399', icon: '⛪', label: 'En la Iglesia' },
  creyente:    { color: '#A78BFA', icon: '🙏', label: 'En el Creyente' },
  fin:         { color: '#FBBF24', icon: '⚡', label: 'En el Tiempo del Fin' },
}

const COLOR_DON = {
  revelacion: '#60A5FA',
  poder:      '#F87171',
  servicio:   '#34D399',
  liderazgo:  '#A78BFA',
}

const FRUTO_COLORES = [
  '#E07070', '#FB923C', '#FBBF24', '#34D399',
  '#60A5FA', '#A78BFA', '#C9A84C', '#7EB8D4', '#6AAF7E',
]

// ─── HELPERS ─────────────────────────────────────────────────
function truncar(t, n = 120) {
  if (!t) return ''
  return t.length > n ? t.substring(0, n) + '...' : t
}

function Chip({ label, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 12px',
      borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
      border: `1px solid ${active ? color : 'var(--border2)'}`,
      background: active ? `${color}18` : 'none',
      color: active ? color : 'var(--text-muted)', letterSpacing: '0.04em',
    }}>{label}</button>
  )
}

function VerseCard({ referencia, texto, color, onClick, badge }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', background: `${color}06`,
      border: `1px solid ${color}20`, borderRadius: 4, cursor: 'pointer',
      transition: 'border-color 0.15s', marginTop: 10,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
    >
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
        {referencia}
        {badge && <span style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 3, padding: '1px 6px' }}>{badge}</span>}
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>→ ir al texto</span>
      </div>
      <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
        "{truncar(texto, 180)}"
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PÁGINA
// ══════════════════════════════════════════════════════════════
export default function Neumatologia() {
  const navigate  = useNavigate()
  const [tab, setTab]       = useState('intro')
  const [data, setData]     = useState({})
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel]       = useState(null)

  // Cargar datos según tab
  useEffect(() => {
    const key = tab === 'intro' ? null
              : tab === 'nombres'  ? 'nombres'
              : tab === 'obras'    ? 'obras'
              : tab === 'simbolos' ? 'simbolos'
              : tab === 'dones'    ? 'dones'
              : tab === 'fruto'    ? 'fruto'
              : tab === 'libro'    ? 'porLibro'
              : null
    if (!key || data[key]) return
    setLoading(true)
    setSel(null)
    setFiltro('todos')
    setBusqueda('')
    queries[key]()
      .then(d => { setData(prev => ({ ...prev, [key]: d })); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  const TABS = [
    { key: 'intro',    label: '🕊️ Introducción' },
    { key: 'nombres',  label: '📛 Nombres' },
    { key: 'obras',    label: '⚡ Obras' },
    { key: 'simbolos', label: '🔥 Símbolos' },
    { key: 'dones',    label: '🎁 Dones' },
    { key: 'fruto',    label: '🌿 Fruto' },
    { key: 'libro',    label: '📚 Por libro' },
  ]

  function irA(libroId, capNum) {
    if (libroId && capNum) navigate(`/leer/${libroId}/${capNum}`)
  }

  // ─── FILTROS POR TAB ──────────────────────────────────────
  const nombres  = (data.nombres  || []).filter(n =>
    (filtro === 'todos' || n.categoria === filtro) &&
    (!busqueda || n.nombre.toLowerCase().includes(busqueda.toLowerCase()) || n.contexto?.toLowerCase().includes(busqueda.toLowerCase()))
  )
  const obras = (data.obras || []).filter(o =>
    (filtro === 'todos' || o.etapa === filtro) &&
    (!busqueda || o.obra.toLowerCase().includes(busqueda.toLowerCase()) || o.descripcion?.toLowerCase().includes(busqueda.toLowerCase()))
  )
  const dones = (data.dones || []).filter(d =>
    (filtro === 'todos' || d.categoria === filtro) &&
    (!busqueda || d.don.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <main style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 900, minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7EB8D4', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          PNEUMATOLOGÍA · πνεῦμα · RUACH
        </div>
        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>
          El Espíritu Santo
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 600 }}>
          Estudio completo de la tercera persona de la Trinidad en toda la Biblia RV1960. Cada dato está anclado al texto bíblico.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--surface2)', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, minWidth: 80,
            fontFamily: 'var(--mono)', fontSize: 10, padding: '9px 12px',
            borderRadius: 6, border: 'none',
            background: tab === t.key ? 'var(--gold)' : 'none',
            color: tab === t.key ? 'var(--bg)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: tab === t.key ? 700 : 400,
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div className="loading"><div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/></div>}

      {/* ══════════════════════════════════════════════════════ */}
      {/* INTRO */}
      {tab === 'intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(126,184,212,0.2)', borderLeft: '3px solid #7EB8D4', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7EB8D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              DEFINICIÓN
            </div>
            <p style={{ fontFamily: 'var(--crimson)', fontSize: 17, color: 'var(--text)', lineHeight: 1.8, margin: 0 }}>
              La Neumatología (del griego <em>πνεῦμα, pneuma</em> = espíritu/viento) es la rama de la teología sistemática que estudia al Espíritu Santo: su persona, naturaleza divina, nombres, obras y relación con el Padre, el Hijo, la creación y los creyentes.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              EL ESPÍRITU ES DIOS
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '0 0 12px' }}>
              Las Escrituras enseñan claramente que el Espíritu Santo es la tercera persona de la Trinidad — no una fuerza, no un ángel, sino Dios mismo. Esto se demuestra por sus atributos divinos:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { attr: 'Omnipresencia', ref: 'Salmos 139:7', texto: '¿A dónde me iré de tu Espíritu?' },
                { attr: 'Omnisciencia', ref: '1 Corintios 2:10', texto: 'El Espíritu todo lo escudriña.' },
                { attr: 'Omnipotencia', ref: 'Lucas 1:35', texto: 'El poder del Altísimo te cubrirá.' },
                { attr: 'Eternidad', ref: 'Hebreos 9:14', texto: 'El Espíritu eterno.' },
                { attr: 'Santidad', ref: 'Romanos 1:4', texto: 'El Espíritu de santidad.' },
                { attr: 'Verdad', ref: 'Juan 16:13', texto: 'El Espíritu de verdad.' },
              ].map(a => (
                <div key={a.attr} style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 4, padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', marginBottom: 2 }}>{a.attr}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)', marginBottom: 4 }}>{a.ref}</div>
                  <p style={{ fontFamily: 'var(--crimson)', fontSize: 13, color: 'var(--text-dim)', margin: 0, fontStyle: 'italic' }}>"{a.texto}"</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid rgba(160,132,76,0.2)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              CONTENIDO DE ESTE ESTUDIO
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {[
                { tab: 'nombres',  icon: '📛', titulo: 'Nombres y títulos', desc: 'Todos los nombres del Espíritu en hebreo y griego' },
                { tab: 'obras',    icon: '⚡', titulo: 'Sus obras', desc: 'Desde la creación hasta el tiempo del fin' },
                { tab: 'simbolos', icon: '🔥', titulo: 'Símbolos bíblicos', desc: 'Paloma, fuego, agua, viento, aceite, sello...' },
                { tab: 'dones',    icon: '🎁', titulo: 'Dones del Espíritu', desc: '1 Co 12, Ro 12, Ef 4 y 1 P 4' },
                { tab: 'fruto',    icon: '🌿', titulo: 'Fruto del Espíritu', desc: 'Los 9 frutos de Gálatas 5:22-23' },
                { tab: 'libro',    icon: '📚', titulo: 'Por libro bíblico', desc: 'Su presencia en cada libro de la Biblia' },
              ].map(s => (
                <div key={s.tab} onClick={() => setTab(s.tab)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{s.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* NOMBRES */}
      {tab === 'nombres' && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 200 }}
              placeholder="Buscar nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {['todos','divino','relacional','funcional','profético','soteriológico'].map(c => (
              <Chip key={c} label={c === 'todos' ? `Todos (${data.nombres?.length || 0})` : c}
                color={COLOR_CAT[c] || 'var(--gold)'} active={filtro === c} onClick={() => setFiltro(c)} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>{nombres.length} nombres y títulos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nombres.map((n, i) => {
              const color = COLOR_CAT[n.categoria] || 'var(--gold)'
              const isOpen = sel === i
              return (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div onClick={() => setSel(isOpen ? null : i)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--crimson)', fontSize: 18, color }}>{n.nombre}</span>
                        {n.hebreo_griego && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>{n.hebreo_griego}</span>}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 3, padding: '2px 6px', marginLeft: 'auto' }}>
                          {n.libro} {n.capitulo}:{n.versiculo}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{truncar(n.contexto, 120)}</p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', lineHeight: 1.7, margin: '12px 0', fontStyle: 'italic' }}>"{n.contexto}"</p>
                      {n.texto_vers && n.libro_id && (
                        <VerseCard referencia={`${n.libro} ${n.capitulo}:${n.versiculo}`} texto={n.texto_vers} color={color}
                          onClick={() => irA(n.libro_id, n.cap_num)} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* OBRAS */}
      {tab === 'obras' && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 200 }}
              placeholder="Buscar obra..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <Chip label={`Todas (${data.obras?.length || 0})`} color="var(--gold)" active={filtro === 'todos'} onClick={() => setFiltro('todos')} />
            {Object.entries(COLOR_ETAPA).map(([key, info]) => (
              <Chip key={key} label={`${info.icon} ${info.label}`} color={info.color} active={filtro === key} onClick={() => setFiltro(key)} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>{obras.length} obras del Espíritu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {obras.map((o, i) => {
              const info = COLOR_ETAPA[o.etapa] || { color: 'var(--gold)', icon: '•', label: o.etapa }
              const isOpen = sel === `o${i}`
              return (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${info.color}20`, borderLeft: `3px solid ${info.color}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div onClick={() => setSel(isOpen ? null : `o${i}`)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{info.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--crimson)', fontSize: 17, color: 'var(--text)' }}>{o.obra}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: info.color, background: `${info.color}15`, border: `1px solid ${info.color}30`, borderRadius: 3, padding: '2px 7px', marginLeft: 'auto' }}>
                          {info.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{truncar(o.descripcion, 120)}</p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, margin: '12px 0' }}>{o.descripcion}</p>
                      {o.texto_clave && (
                        <div style={{ background: `${info.color}08`, border: `1px solid ${info.color}20`, borderRadius: 4, padding: '10px 14px', marginBottom: 8 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: info.color, marginBottom: 4 }}>{o.libro} {o.capitulo}:{o.versiculo}</div>
                          <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{o.texto_clave}"</p>
                        </div>
                      )}
                      {o.texto_vers && o.libro_id && o.texto_vers !== o.texto_clave && (
                        <VerseCard referencia={`${o.libro} ${o.capitulo}:${o.versiculo}`} texto={o.texto_vers} color={info.color}
                          onClick={() => irA(o.libro_id, o.cap_num)} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* SÍMBOLOS */}
      {tab === 'simbolos' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {(data.simbolos || []).map((s, i) => {
            const COLS = ['#C9A84C','#F87171','#7EB8D4','#60A5FA','#C9A84C','#A78BFA','#FBBF24','#C9A84C','#34D399','#FB923C']
            const color = COLS[i % COLS.length]
            const isOpen = sel === `s${i}`
            return (
              <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color : color+'25'}`, borderTop: `3px solid ${color}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div onClick={() => setSel(isOpen ? null : `s${i}`)} style={{ padding: '16px', cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--crimson)', fontSize: 22, color, marginBottom: 8 }}>{s.simbolo}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 8px' }}>{truncar(s.significado, 100)}</p>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color }}>
                    {s.libro} {s.capitulo}:{s.versiculo}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '12px 0' }}>{s.significado}</p>
                    {s.contexto && (
                      <div onClick={() => irA(s.libro_id, s.cap_num)}
                        style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 4, padding: '10px 14px', cursor: 'pointer' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color, marginBottom: 4 }}>
                          {s.libro} {s.capitulo}:{s.versiculo} →
                        </div>
                        <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{s.contexto}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* DONES */}
      {tab === 'dones' && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius)', outline: 'none', minWidth: 180 }}
              placeholder="Buscar don..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {['todos','revelacion','poder','servicio','liderazgo'].map(c => (
              <Chip key={c} label={c === 'todos' ? `Todos (${data.dones?.length || 0})` : c}
                color={COLOR_DON[c] || 'var(--gold)'} active={filtro === c} onClick={() => setFiltro(c)} />
            ))}
          </div>

          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--gold)', lineHeight: 1.6, margin: 0 }}>
              <strong>Fuente:</strong> Los dones enumerados provienen de 1 Corintios 12:8-10, Romanos 12:6-8, Efesios 4:11 y 1 Pedro 4:11. El Espíritu los distribuye soberanamente (1 Co 12:11).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {dones.map((d, i) => {
              const color = COLOR_DON[d.categoria] || 'var(--gold)'
              const isOpen = sel === `d${i}`
              return (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color : color+'20'}`, borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div onClick={() => setSel(isOpen ? null : `d${i}`)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--crimson)', fontSize: 16, color }}>{d.don}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 3, padding: '2px 6px', marginLeft: 'auto' }}>{d.categoria}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>{truncar(d.descripcion, 80)}</p>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>{d.libro} {d.capitulo}:{d.versiculo}</div>
                  </div>
                  {isOpen && d.texto_vers && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '10px 0 8px' }}>{d.descripcion}</p>
                      <VerseCard referencia={`${d.libro} ${d.capitulo}:${d.versiculo}`} texto={d.texto_vers} color={color}
                        onClick={() => irA(d.libro_id, d.cap_num)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* FRUTO */}
      {tab === 'fruto' && !loading && (
        <div>
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 6, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', letterSpacing: '0.1em', marginBottom: 6 }}>GÁLATAS 5:22-23 · RV1960</div>
            <p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
              "Mas el fruto del Espíritu es: amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley."
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Note que Pablo usa el singular <em>fruto</em> (καρπός, karpos) — no <em>frutos</em>. Es un solo fruto con nueve características. El Espíritu produce en el creyente el carácter de Cristo.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {(data.fruto || []).map((f, i) => {
              const color = FRUTO_COLORES[i % FRUTO_COLORES.length]
              const isOpen = sel === `f${i}`
              return (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color : color+'20'}`, borderTop: `3px solid ${color}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div onClick={() => setSel(isOpen ? null : `f${i}`)} style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, color, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontFamily: 'var(--crimson)', fontSize: 22, color }}>{f.fruto}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{truncar(f.descripcion, 90)}</p>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '10px 0 8px' }}>{f.descripcion}</p>
                      {f.texto_vers && (
                        <VerseCard referencia={`${f.libro} ${f.capitulo}:${f.versiculo}`} texto={f.texto_vers} color={color}
                          onClick={() => irA(f.libro_id, f.cap_num)} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* POR LIBRO */}
      {tab === 'libro' && !loading && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            El Espíritu Santo aparece en {data.porLibro?.length || 33} libros de la Biblia — desde Génesis hasta Apocalipsis. Hechos es el libro con más menciones (~55 veces).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.porLibro || []).map((p, i) => {
              const maxMenciones = Math.max(...(data.porLibro || []).map(x => x.total_menciones))
              const pct = (p.total_menciones / maxMenciones) * 100
              const isOpen = sel === `l${i}`
              const color = p.total_menciones >= 20 ? '#C9A84C' : p.total_menciones >= 10 ? '#34D399' : p.total_menciones >= 5 ? '#60A5FA' : 'var(--text-muted)'
              return (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color : 'var(--border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div onClick={() => setSel(isOpen ? null : `l${i}`)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', width: 100, flexShrink: 0 }}>{p.libro}</span>
                    <div style={{ flex: 1, height: 16, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `${color}60`, borderRight: `2px solid ${color}`, transition: 'width 0.4s', minWidth: p.total_menciones > 0 ? 4 : 0 }}/>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, width: 30, textAlign: 'right', flexShrink: 0 }}>{p.total_menciones}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: '10px 0 8px' }}>{p.resumen}</p>
                      {p.texto_vers && p.libro_id && (
                        <VerseCard referencia={`${p.versiculo_clave_libro} ${p.versiculo_clave_cap}:${p.versiculo_clave_vers}`}
                          texto={p.texto_vers} color={color} onClick={() => irA(p.libro_id, p.cap_num)}
                          badge="Versículo clave" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}