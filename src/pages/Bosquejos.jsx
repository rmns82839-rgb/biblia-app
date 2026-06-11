import { useState, useEffect, useRef, useCallback } from 'react'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

// ─── BUSCAR VERSÍCULO POR REFERENCIA ────────────────────────
async function buscarReferencia(ref) {
  // Parsear "Juan 3:16", "Jn 3:16", "Juan 3.16"
  const m = ref.trim().match(/^(.+?)\s+(\d+)[:.:](\d+)$/i)
  if (!m) return null
  const [, libro, cap, vers] = m
  const rows = await sql`
    SELECT v.texto, l.nombre AS libro, l.abreviatura,
           c.numero AS capitulo, v.numero AS versiculo
    FROM versiculos v
    JOIN capitulos c ON v.capitulo_id = c.id
    JOIN libros l    ON v.libro_id    = l.id
    WHERE (l.nombre ILIKE ${`%${libro}%`} OR l.abreviatura ILIKE ${`%${libro}%`})
      AND c.numero = ${parseInt(cap)}
      AND v.numero = ${parseInt(vers)}
    LIMIT 1
  `
  return rows[0] || null
}

async function buscarVersiculoTexto(termino, limite = 20) {
  if (!termino || termino.length < 3) return []
  return await sql`
    SELECT v.texto, l.nombre AS libro, l.abreviatura,
           c.numero AS capitulo, v.numero AS versiculo
    FROM versiculos v
    JOIN capitulos c ON v.capitulo_id = c.id
    JOIN libros l    ON v.libro_id    = l.id
    WHERE to_tsvector('spanish', v.texto) @@ plainto_tsquery('spanish', ${termino})
    ORDER BY l.orden, c.numero, v.numero
    LIMIT ${limite}
  `
}

async function guardarBosquejo(bosquejo) {
  try {
    await sql`
      INSERT INTO bosquejos (titulo, datos, updated_at)
      VALUES (${bosquejo.titulo || 'Sin título'}, ${JSON.stringify(bosquejo)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET datos = ${JSON.stringify(bosquejo)}::jsonb,
        titulo = ${bosquejo.titulo || 'Sin título'}, updated_at = NOW()
    `
  } catch(e) {
    // Si la tabla no existe, la creamos
    await sql`
      CREATE TABLE IF NOT EXISTS bosquejos (
        id SERIAL PRIMARY KEY,
        titulo TEXT,
        datos JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      INSERT INTO bosquejos (titulo, datos)
      VALUES (${bosquejo.titulo || 'Sin título'}, ${JSON.stringify(bosquejo)}::jsonb)
    `
  }
}

async function cargarBosquejos() {
  try {
    return await sql`SELECT id, titulo, updated_at FROM bosquejos ORDER BY updated_at DESC LIMIT 20`
  } catch(e) { return [] }
}

async function cargarBosquejoById(id) {
  try {
    const rows = await sql`SELECT datos FROM bosquejos WHERE id = ${id}`
    return rows[0]?.datos || null
  } catch(e) { return null }
}

// ─── ESTADO INICIAL ──────────────────────────────────────────
const BOSQUEJO_INICIAL = {
  id: null,
  proposito: '',
  texto_base: '',
  tema: '',
  titulo: '',
  proposicion: '',
  notas_preliminares: [],
  introduccion: {
    gancho: '',
    contexto: '',
    transicion: '',
    notas: [],
  },
  puntos: [
    {
      id: 1, titulo: '',
      explicacion: '', ilustracion: '', aplicacion: '',
      subpuntos: [],
      citas: [],
      notas: [],
    }
  ],
  conclusion: {
    resumen: '',
    llamado: '',
    oracion: '',
    notas: [],
  },
  notas: [],
}

const PROPOSITOS = [
  { key: 'evangelistico', icon: '🌱', label: 'Evangelístico',  color: '#34D399', desc: 'Presentar el mensaje de salvación a los no creyentes.' },
  { key: 'doctrinal',     icon: '📖', label: 'Doctrinal',      color: '#60A5FA', desc: 'Enseñar y explicar las verdades de la fe cristiana.' },
  { key: 'devocional',    icon: '🙏', label: 'Devocional',     color: '#A78BFA', desc: 'Fomentar el crecimiento espiritual y la intimidad con Dios.' },
  { key: 'etico',         icon: '⚖️', label: 'Ético-Moral',    color: '#FB923C', desc: 'Proveer principios bíblicos prácticos para el diario vivir.' },
  { key: 'aliento',       icon: '💛', label: 'De Aliento',     color: '#FDE047', desc: 'Consolar, fortalecer y llenar de esperanza en tiempos de prueba.' },
]

// ─── IDs únicos ──────────────────────────────────────────────
let _id = 100
const uid = () => ++_id

// ─── COMPONENTE: BUSCADOR DE CITAS ──────────────────────────
function BuscadorCitas({ onAgregar, onCerrar }) {
  const [input, setInput]         = useState('')
  const [resultado, setResultado] = useState(null)
  const [sugerencias, setSugerencias] = useState([])
  const [loading, setLoading]     = useState(false)
  const [limite, setLimite]       = useState(20)
  const timer = useRef(null)

  async function buscar(val, lim = 20) {
    if (!val.trim()) { setResultado(null); setSugerencias([]); return }
    setLoading(true)
    // Intenta referencia exacta primero
    const ref = await buscarReferencia(val)
    if (ref) { setResultado(ref); setSugerencias([]); setLoading(false); return }
    // Busca por texto en toda la Biblia
    const sugs = await buscarVersiculoTexto(val, lim)
    setSugerencias(sugs)
    setResultado(null)
    setLoading(false)
  }

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => buscar(input, limite), 400)
  }, [input, limite])

  const usar = (v) => {
    onAgregar({ ref: `${v.abreviatura} ${v.capitulo}:${v.versiculo}`, texto: v.texto })
    onCerrar()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,12,10,0.95)', zIndex: 9000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 12px',
      overflowY: 'auto',
    }} onClick={onCerrar}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 580,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
        marginTop: 20,
      }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em' }}>
              📖 INSERTAR CITA BÍBLICA
            </span>
            <button onClick={onCerrar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>
          <input
            autoFocus
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--gold-dim)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 15, padding: '12px 14px', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
            placeholder='Ej: "Juan 3:16" o busca palabras del versículo...'
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              Escribe referencia o palabras · Busca en toda la Biblia
            </span>
            <select
              value={limite}
              onChange={e => setLimite(Number(e.target.value))}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 9, padding: '3px 8px', borderRadius: 4, outline: 'none', marginLeft: 'auto' }}
            >
              <option value={10}>10 resultados</option>
              <option value={20}>20 resultados</option>
              <option value={50}>50 resultados</option>
              <option value={100}>Toda la Biblia</option>
            </select>
          </div>
        </div>

        {/* Sugerencias rápidas */}
        {!input && (
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>CITAS FRECUENTES</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Juan 3:16','Romanos 8:28','Filipenses 4:13','Salmos 23:1','Isaías 40:31','Mateo 28:19','Hebreos 11:1','Proverbios 3:5'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold-dim)',
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  borderRadius: 4, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--gold-dim)' }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Buscando en toda la Biblia...
            </div>
          )}

          {resultado && (
            <div onClick={() => usar(resultado)}
              style={{ padding: '14px 18px', cursor: 'pointer', background: 'rgba(201,168,76,0.04)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', marginBottom: 6 }}>
                ✦ {resultado.abreviatura} {resultado.capitulo}:{resultado.versiculo} — {resultado.libro}
              </div>
              <p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                {resultado.texto}
              </p>
            </div>
          )}

          {sugerencias.map((v, i) => (
            <div key={i} onClick={() => usar(v)}
              style={{ padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid rgba(30,41,30,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)', marginBottom: 4 }}>
                {v.abreviatura} {v.capitulo}:{v.versiculo} — {v.libro}
              </div>
              <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                {v.texto.length > 120 ? v.texto.substring(0, 120) + '...' : v.texto}
              </p>
            </div>
          ))}

          {!loading && !resultado && !sugerencias.length && input.length > 2 && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Sin resultados — intenta con otras palabras o una referencia exacta
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE: NOTA FLOTANTE ───────────────────────────────
function NotaFlotante({ nota, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const colores = ['#C9A84C', '#34D399', '#60A5FA', '#FB923C', '#A78BFA', '#F87171']
  const color = colores[nota.color % colores.length]

  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`, borderRadius: 6,
      marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: 14 }}>📌</span>
        <input
          style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }}
          placeholder="Título de la nota..."
          value={nota.titulo}
          onChange={e => onChange({ ...nota, titulo: e.target.value })}
        />
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--mono)' }}>
          {expanded ? '▲' : '▼'}
        </button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
      {expanded && (
        <textarea
          style={{ width: '100%', background: 'none', border: 'none', borderTop: `1px solid ${color}20`, color: 'var(--text-dim)', fontFamily: 'var(--sans)', fontSize: 13, padding: '10px 12px', resize: 'vertical', minHeight: 80, outline: 'none', lineHeight: 1.6 }}
          placeholder="Contenido de la nota..."
          value={nota.contenido}
          onChange={e => onChange({ ...nota, contenido: e.target.value })}
        />
      )}
    </div>
  )
}

// ─── CLIP DE NOTAS ANCLADO ───────────────────────────────────
// Aparece como 📎 y al hacer click despliega notas para esa sección
function ClipNotas({ notas = [], onChange, label = '' }) {
  const [abierto, setAbierto] = useState(false)
  const COLORES = ['#C9A84C', '#34D399', '#60A5FA', '#FB923C', '#A78BFA', '#F87171']

  function agregar() {
    onChange([...notas, { id: uid(), titulo: '', contenido: '', color: notas.length % 6, expandido: true }])
  }

  function actualizarNota(id, datos) {
    onChange(notas.map(n => n.id === id ? { ...n, ...datos } : n))
  }

  function eliminarNota(id) {
    onChange(notas.filter(n => n.id !== id))
  }

  function toggleNota(id) {
    onChange(notas.map(n => n.id === id ? { ...n, expandido: !n.expandido } : n))
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botón clip */}
      <button
        onClick={() => setAbierto(!abierto)}
        title={notas.length > 0 ? `${notas.length} nota${notas.length > 1 ? 's' : ''} — ${label}` : `Agregar nota — ${label}`}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: 4,
          color: notas.length > 0 ? '#C9A84C' : 'var(--text-muted)',
          fontSize: 14, transition: 'all 0.15s',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        📎
        {notas.length > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#C9A84C', color: 'var(--bg)',
            fontFamily: 'var(--mono)', fontSize: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
          }}>{notas.length}</span>
        )}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 500,
          width: 320, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              📎 {label || 'Notas'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregar} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', background: 'var(--gold-glow)', border: '1px solid var(--gold-dim)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.05em' }}>
                + Nota
              </button>
              <button onClick={() => setAbierto(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
            </div>
          </div>

          {/* Notas */}
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: notas.length ? '8px' : 0 }}>
            {notas.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Sin notas — haz click en "+ Nota"
              </div>
            )}
            {notas.map(n => {
              const color = COLORES[n.color % COLORES.length]
              return (
                <div key={n.id} style={{ background: `${color}08`, border: `1px solid ${color}25`, borderLeft: `3px solid ${color}`, borderRadius: 5, marginBottom: 6, overflow: 'hidden' }}>
                  {/* Header de la nota */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px' }}>
                    <input
                      style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}
                      placeholder="Nota..."
                      value={n.titulo}
                      onChange={e => actualizarNota(n.id, { titulo: e.target.value })}
                      onClick={e => e.stopPropagation()}
                    />
                    <button onClick={() => toggleNota(n.id)} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 9, fontFamily: 'var(--mono)', padding: '2px 4px' }}>
                      {n.expandido ? '▲' : '▼'}
                    </button>
                    <button onClick={() => eliminarNota(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>×</button>
                  </div>
                  {/* Contenido expandido */}
                  {n.expandido && (
                    <textarea
                      style={{ width: '100%', background: 'none', border: 'none', borderTop: `1px solid ${color}20`, color: 'var(--text-dim)', fontFamily: 'var(--sans)', fontSize: 12, padding: '8px 10px', resize: 'vertical', minHeight: 60, maxHeight: 150, outline: 'none', lineHeight: 1.6 }}
                      placeholder="Escribe tu nota aquí..."
                      value={n.contenido}
                      onChange={e => actualizarNota(n.id, { contenido: e.target.value })}
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CAMPO DE TEXTO ──────────────────────────────────────────
function Campo({ label, valor, onChange, placeholder, multiline = false, rows = 3, color = 'var(--gold-dim)', hint }) {
  const style = {
    width: '100%', background: 'var(--surface2)', border: `1px solid var(--border2)`,
    color: 'var(--text)', fontFamily: multiline ? 'var(--crimson)' : 'var(--sans)',
    fontSize: multiline ? 16 : 13, padding: '10px 14px',
    borderRadius: 6, outline: 'none', resize: multiline ? 'vertical' : 'none',
    lineHeight: 1.7, transition: 'border-color 0.2s',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontFamily: 'var(--mono)', fontSize: 9, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
        {hint && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{hint}</span>}
      </div>
      {multiline
        ? <textarea rows={rows} style={style} placeholder={placeholder} value={valor} onChange={e => onChange(e.target.value)}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        : <input type="text" style={style} placeholder={placeholder} value={valor} onChange={e => onChange(e.target.value)}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
      }
    </div>
  )
}

// ─── COMPONENTE: PUNTO PRINCIPAL ────────────────────────────
function PuntoPrincipal({ punto, num, onChange, onDelete, onAddCita }) {
  const [expanded, setExpanded] = useState(true)
  const [addSub, setAddSub]     = useState(false)

  const actualizar = (campo, val) => onChange({ ...punto, [campo]: val })

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderLeft: '3px solid var(--gold)', borderRadius: 8, marginBottom: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(201,168,76,0.04)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bg)', fontWeight: 700, flexShrink: 0,
        }}>{num}</div>
        <input
          style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'var(--crimson)', fontSize: 17, outline: 'none' }}
          placeholder={`Punto principal ${num}...`}
          value={punto.titulo}
          onChange={e => actualizar('titulo', e.target.value)}
        />
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--mono)' }}>
          {expanded ? '▲' : '▼'}
        </button>
        <ClipNotas label={`Punto ${num}`} notas={punto.notas || []} onChange={v => onChange({ ...punto, notas: v })} />
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {expanded && (
        <div style={{ padding: '16px' }}>
          <Campo label="Explicación" valor={punto.explicacion} onChange={v => actualizar('explicacion', v)}
            placeholder="Aclaración teológica y textual del punto..." multiline rows={3} color="#60A5FA" />
          <Campo label="Ilustración" valor={punto.ilustracion} onChange={v => actualizar('ilustracion', v)}
            placeholder="Un ejemplo, testimonio o analogía que clarifique el concepto..." multiline rows={2} color="#FB923C" />
          <Campo label="Aplicación práctica" valor={punto.aplicacion} onChange={v => actualizar('aplicacion', v)}
            placeholder="¿Cómo se traduce esta verdad en la vida diaria de los oyentes hoy?" multiline rows={2} color="#34D399" />

          {/* Citas del punto */}
          {punto.citas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>CITAS BÍBLICAS</div>
              {punto.citas.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 4, padding: '8px 12px', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)', marginBottom: 4 }}>{c.ref}</div>
                    <p style={{ fontFamily: 'var(--crimson)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{c.texto}</p>
                  </div>
                  <button onClick={() => actualizar('citas', punto.citas.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => onAddCita(punto.id)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold-dim)',
            background: 'none', border: '1px dashed var(--border2)',
            borderRadius: 4, padding: '6px 14px', cursor: 'pointer',
            letterSpacing: '0.05em', transition: 'all 0.15s', marginRight: 8,
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--gold-dim)' }}
          >+ Cita bíblica</button>

          {/* Subpuntos */}
          {punto.subpuntos.map((sp, si) => (
            <div key={sp.id} style={{ marginTop: 8, marginLeft: 20, background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '2px solid var(--gold-dim)', borderRadius: 4, padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)' }}>{num}.{si + 1}</span>
                <input
                  style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'var(--crimson)', fontSize: 14, outline: 'none' }}
                  placeholder="Subpunto..."
                  value={sp.titulo}
                  onChange={e => actualizar('subpuntos', punto.subpuntos.map((s, j) => j === si ? { ...s, titulo: e.target.value } : s))}
                />
                <button onClick={() => actualizar('subpuntos', punto.subpuntos.filter((_, j) => j !== si))}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>×</button>
              </div>
            </div>
          ))}

          <button onClick={() => actualizar('subpuntos', [...punto.subpuntos, { id: uid(), titulo: '' }])} style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)',
            background: 'none', border: '1px dashed rgba(93,87,72,0.5)',
            borderRadius: 4, padding: '5px 12px', cursor: 'pointer',
            letterSpacing: '0.05em', marginTop: 8,
          }}>+ Subpunto</button>
        </div>
      )}
    </div>
  )
}

// ─── VISTA PREVIA / EXPORTAR ─────────────────────────────────
function VistaPrevia({ bosquejo, onCerrar }) {
  const propInfo = PROPOSITOS.find(p => p.key === bosquejo.proposito)

  const imprimir = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>${bosquejo.titulo || 'Bosquejo'}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1a1a1a; line-height: 1.8; }
        h1 { font-size: 28px; font-weight: normal; margin-bottom: 4px; }
        h2 { font-size: 18px; font-weight: bold; margin-top: 32px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
        h3 { font-size: 15px; font-weight: bold; margin-top: 20px; }
        .meta { font-size: 12px; color: #666; font-family: monospace; margin-bottom: 32px; }
        .cita { background: #f9f6ee; border-left: 3px solid #c9a84c; padding: 10px 14px; margin: 12px 0; font-style: italic; }
        .cita-ref { font-size: 11px; font-family: monospace; color: #888; margin-bottom: 4px; }
        .subpunto { margin-left: 20px; font-size: 14px; }
        label { font-size: 11px; font-family: monospace; color: #999; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-top: 16px; margin-bottom: 4px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>${bosquejo.titulo || 'Sin título'}</h1>
      <div class="meta">
        ${propInfo ? `Propósito: ${propInfo.label}` : ''}
        ${bosquejo.texto_base ? ` · Texto: ${bosquejo.texto_base}` : ''}
        ${bosquejo.tema ? ` · Tema: ${bosquejo.tema}` : ''}
      </div>
      ${bosquejo.proposicion ? `<p><strong>Proposición:</strong> ${bosquejo.proposicion}</p>` : ''}

      <h2>I. Introducción</h2>
      ${bosquejo.introduccion.gancho ? `<label>Gancho</label><p>${bosquejo.introduccion.gancho}</p>` : ''}
      ${bosquejo.introduccion.contexto ? `<label>Contexto</label><p>${bosquejo.introduccion.contexto}</p>` : ''}
      ${bosquejo.introduccion.transicion ? `<label>Transición</label><p>${bosquejo.introduccion.transicion}</p>` : ''}

      <h2>II. Desarrollo</h2>
      ${bosquejo.puntos.map((p, i) => `
        <h3>${i + 1}. ${p.titulo || `Punto ${i + 1}`}</h3>
        ${p.citas.map(c => `<div class="cita"><div class="cita-ref">${c.ref}</div>${c.texto}</div>`).join('')}
        ${p.explicacion ? `<label>Explicación</label><p>${p.explicacion}</p>` : ''}
        ${p.ilustracion ? `<label>Ilustración</label><p>${p.ilustracion}</p>` : ''}
        ${p.aplicacion  ? `<label>Aplicación</label><p>${p.aplicacion}</p>` : ''}
        ${p.subpuntos.map((s, si) => `<div class="subpunto">${i + 1}.${si + 1} ${s.titulo}</div>`).join('')}
      `).join('')}

      <h2>III. Conclusión</h2>
      ${bosquejo.conclusion.resumen ? `<label>Resumen</label><p>${bosquejo.conclusion.resumen}</p>` : ''}
      ${bosquejo.conclusion.llamado ? `<label>Llamado a la acción</label><p>${bosquejo.conclusion.llamado}</p>` : ''}
      ${bosquejo.conclusion.oracion ? `<label>Oración final</label><p><em>${bosquejo.conclusion.oracion}</em></p>` : ''}

      ${bosquejo.notas.length ? `<h2>Notas</h2>${bosquejo.notas.map(n => `<div class="cita"><strong>${n.titulo}</strong><br/>${n.contenido}</div>`).join('')}` : ''}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,10,0.95)', zIndex: 8000, overflowY: 'auto', padding: '40px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300 }}>Vista previa</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={imprimir} className="btn-primary" style={{ fontSize: 11 }}>🖨️ Imprimir / PDF</button>
            <button onClick={onCerrar} className="btn-secondary" style={{ fontSize: 11 }}>Cerrar</button>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--crimson)', fontSize: 36, color: 'var(--text)', fontWeight: 300, marginBottom: 8 }}>{bosquejo.titulo || 'Sin título'}</h1>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {propInfo && <span style={{ color: propInfo.color }}>{propInfo.icon} {propInfo.label}</span>}
          {bosquejo.texto_base && <span>📖 {bosquejo.texto_base}</span>}
          {bosquejo.tema && <span>🏷 {bosquejo.tema}</span>}
        </div>

        {bosquejo.proposicion && (
          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 4, padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', marginBottom: 4 }}>PROPOSICIÓN</div>
            <p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', margin: 0 }}>{bosquejo.proposicion}</p>
          </div>
        )}

        {/* Introducción */}
        {(bosquejo.introduccion.gancho || bosquejo.introduccion.contexto) && (
          <>
            <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 22, color: 'var(--gold)', fontWeight: 400, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>I. Introducción</h2>
            {bosquejo.introduccion.gancho && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>GANCHO</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>{bosquejo.introduccion.gancho}</p></>}
            {bosquejo.introduccion.contexto && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>CONTEXTO</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>{bosquejo.introduccion.contexto}</p></>}
            {bosquejo.introduccion.transicion && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>TRANSICIÓN</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text-dim)', marginBottom: 16, fontStyle: 'italic' }}>{bosquejo.introduccion.transicion}</p></>}
          </>
        )}

        {/* Puntos */}
        <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 22, color: 'var(--gold)', fontWeight: 400, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>II. Desarrollo</h2>
        {bosquejo.puntos.map((p, i) => (
          <div key={p.id} style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--crimson)', fontSize: 19, color: 'var(--text)', fontWeight: 500, marginBottom: 10 }}>{i + 1}. {p.titulo || `Punto ${i + 1}`}</h3>
            {p.citas.map((c, ci) => (
              <div key={ci} style={{ background: 'rgba(201,168,76,0.05)', borderLeft: '3px solid var(--gold)', padding: '8px 14px', marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold-dim)', marginBottom: 4 }}>{c.ref}</div>
                <p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>{c.texto}</p>
              </div>
            ))}
            {p.explicacion && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, marginTop: 10 }}>EXPLICACIÓN</div><p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.7 }}>{p.explicacion}</p></>}
            {p.ilustracion && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#FB923C', marginBottom: 4 }}>ILUSTRACIÓN</div><p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.7 }}>{p.ilustracion}</p></>}
            {p.aplicacion  && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', marginBottom: 4 }}>APLICACIÓN</div><p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.7 }}>{p.aplicacion}</p></>}
            {p.subpuntos.map((s, si) => (
              <div key={s.id} style={{ marginLeft: 16, fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text-dim)', padding: '4px 0 4px 12px', borderLeft: '2px solid var(--border2)' }}>
                {i + 1}.{si + 1} {s.titulo}
              </div>
            ))}
          </div>
        ))}

        {/* Conclusión */}
        {(bosquejo.conclusion.resumen || bosquejo.conclusion.llamado) && (
          <>
            <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 22, color: 'var(--gold)', fontWeight: 400, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>III. Conclusión</h2>
            {bosquejo.conclusion.resumen && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>RESUMEN</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>{bosquejo.conclusion.resumen}</p></>}
            {bosquejo.conclusion.llamado && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', marginBottom: 4 }}>LLAMADO A LA ACCIÓN</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>{bosquejo.conclusion.llamado}</p></>}
            {bosquejo.conclusion.oracion && <><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#A78BFA', marginBottom: 4 }}>ORACIÓN FINAL</div><p style={{ fontFamily: 'var(--crimson)', fontSize: 15, color: 'var(--text-dim)', fontStyle: 'italic' }}>{bosquejo.conclusion.oracion}</p></>}
          </>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function Bosquejos() {
  const [bosquejo, setBosquejo]   = useState({ ...BOSQUEJO_INICIAL, puntos: [{ id: uid(), titulo: '', explicacion: '', ilustracion: '', aplicacion: '', subpuntos: [], citas: [], notas: [] }] })
  const [seccion, setSeccion]     = useState('proposito') // proposito | preliminares | intro | desarrollo | conclusion | notas
  const [showCitas, setShowCitas] = useState(false)
  const [citaTarget, setCitaTarget] = useState(null)
  const [showPrevia, setShowPrevia] = useState(false)
  const [guardado, setGuardado]   = useState(false)
  const [listaBosquejos, setListaBosquejos] = useState([])
  const [showLista, setShowLista] = useState(false)

  // Auto-guardar cada 30s
  useEffect(() => {
    const timer = setInterval(() => {
      if (bosquejo.titulo || bosquejo.puntos[0]?.titulo) {
        guardarBosquejo(bosquejo).then(() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) })
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [bosquejo])

  const actualizar = (campo, valor) => setBosquejo(prev => ({ ...prev, [campo]: valor }))
  const actualizarIntro = (campo, valor) => setBosquejo(prev => ({ ...prev, introduccion: { ...prev.introduccion, [campo]: valor } }))
  const actualizarConclusion = (campo, valor) => setBosquejo(prev => ({ ...prev, conclusion: { ...prev.conclusion, [campo]: valor } }))

  function actualizarPunto(id, datos) {
    setBosquejo(prev => ({ ...prev, puntos: prev.puntos.map(p => p.id === id ? { ...p, ...datos } : p) }))
  }

  function agregarPunto() {
    setBosquejo(prev => ({ ...prev, puntos: [...prev.puntos, { id: uid(), titulo: '', explicacion: '', ilustracion: '', aplicacion: '', subpuntos: [], citas: [], notas: [] }] }))
  }

  function eliminarPunto(id) {
    setBosquejo(prev => ({ ...prev, puntos: prev.puntos.filter(p => p.id !== id) }))
  }

  function abrirBuscadorCita(puntoId) {
    setCitaTarget(puntoId)
    setShowCitas(true)
  }

  function agregarCita(cita) {
    if (citaTarget) {
      setBosquejo(prev => ({ ...prev, puntos: prev.puntos.map(p => p.id === citaTarget ? { ...p, citas: [...p.citas, cita] } : p) }))
    }
  }

  function agregarNota() {
    setBosquejo(prev => ({ ...prev, notas: [...prev.notas, { id: uid(), titulo: '', contenido: '', color: prev.notas.length % 6 }] }))
  }

  const propActual = PROPOSITOS.find(p => p.key === bosquejo.proposito)

  const SECCIONES = [
    { key: 'proposito',    label: '🎯 Propósito' },
    { key: 'preliminares', label: '📌 Datos' },
    { key: 'intro',        label: '🚪 Introducción' },
    { key: 'desarrollo',   label: '📖 Desarrollo' },
    { key: 'conclusion',   label: '✅ Conclusión' },
    { key: 'notas',        label: '📎 Notas' },
  ]

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ─── TOPBAR DEL BOSQUEJO ─── */}
      <div className="bosquejo-topbar" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'sticky', top: 56, zIndex: 85 }}>
        <input
          style={{ flex: 1, minWidth: 200, background: 'none', border: 'none', color: 'var(--gold)', fontFamily: 'var(--crimson)', fontSize: 20, outline: 'none' }}
          placeholder="Título del sermón..."
          value={bosquejo.titulo}
          onChange={e => actualizar('titulo', e.target.value)}
        />
        {propActual && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: propActual.color, background: `${propActual.color}15`, border: `1px solid ${propActual.color}30`, borderRadius: 4, padding: '4px 10px' }}>
            {propActual.icon} {propActual.label}
          </span>
        )}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {guardado && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#34D399', alignSelf: 'center' }}>✓ guardado</span>}
          <button onClick={() => { guardarBosquejo(bosquejo).then(() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }) }} className="btn-secondary" style={{ fontSize: 10 }}>💾 Guardar</button>
          <button onClick={() => { cargarBosquejos().then(setListaBosquejos); setShowLista(true) }} className="btn-secondary" style={{ fontSize: 10 }}>📂 Mis bosquejos</button>
          <button onClick={() => setShowPrevia(true)} className="btn-primary" style={{ fontSize: 10 }}>👁 Vista previa</button>
        </div>
      </div>

      {/* ─── NAV DE SECCIONES ─── */}
      <div className="bosquejo-secnav" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {SECCIONES.map(s => (
          <button key={s.key} onClick={() => setSeccion(s.key)} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '10px 14px', border: 'none',
            background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            color: seccion === s.key ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: `2px solid ${seccion === s.key ? 'var(--gold)' : 'transparent'}`,
            transition: 'all 0.15s', letterSpacing: '0.04em',
          }}>{s.label}</button>
        ))}
      </div>

      {/* ─── CONTENIDO ─── */}
      <div className="bosquejo-content" style={{ flex: 1, padding: '28px 32px 100px', maxWidth: 760, overflowY: 'auto' }}>

        {/* SECCIÓN: PROPÓSITO */}
        {seccion === 'proposito' && (
          <div>
            <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300, marginBottom: 6 }}>¿Cuál es el propósito de este sermón?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
              El propósito define el corazón del mensaje. Selecciona el que guiará toda la preparación.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PROPOSITOS.map(p => (
                <div key={p.key} onClick={() => { actualizar('proposito', p.key); setSeccion('preliminares') }}
                  className="proposito-card"
                  style={{
                    background: bosquejo.proposito === p.key ? `${p.color}12` : 'var(--surface)',
                    border: `1px solid ${bosquejo.proposito === p.key ? p.color : 'var(--border)'}`,
                    borderLeft: `4px solid ${p.color}`, borderRadius: 8,
                    padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', gap: 16, alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (bosquejo.proposito !== p.key) e.currentTarget.style.borderColor = p.color }}
                  onMouseLeave={e => { if (bosquejo.proposito !== p.key) e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <span className="proposito-card-icon" style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="proposito-card-label" style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 16, color: p.color, marginBottom: 4 }}>{p.label}</div>
                    <div className="proposito-card-desc" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                  {bosquejo.proposito === p.key && <span style={{ color: p.color, fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: PRELIMINARES */}
        {seccion === 'preliminares' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300 }}>Elementos preliminares</h2>
              <ClipNotas label="Preliminares" notas={bosquejo.notas_preliminares || []} onChange={v => actualizar('notas_preliminares', v)} />
            </div>
            <Campo label="Texto base" valor={bosquejo.texto_base} onChange={v => actualizar('texto_base', v)}
              placeholder="Ej: Juan 3:16 o Romanos 8:28-39" hint="El pasaje central del sermón" />
            <Campo label="Tema" valor={bosquejo.tema} onChange={v => actualizar('tema', v)}
              placeholder="La idea principal en pocas palabras. Ej: El perdón de Dios" />
            <Campo label="Proposición" valor={bosquejo.proposicion} onChange={v => actualizar('proposicion', v)}
              placeholder="Una oración completa que resume la enseñanza central y la respuesta esperada de la audiencia."
              multiline rows={2} hint="10-15% del sermón" />
            {bosquejo.texto_base && (
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                <button onClick={() => { setCitaTarget(null); setShowCitas(true) }} style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 4, padding: '7px 14px', cursor: 'pointer', letterSpacing: '0.05em',
                }}>📖 Buscar versículo del texto base</button>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN: INTRODUCCIÓN */}
        {seccion === 'intro' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300 }}>Introducción</h2>
              <ClipNotas label="Introducción" notas={bosquejo.introduccion.notas || []} onChange={v => actualizarIntro('notas', v)} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>10–15% del tiempo total. Breve, directa y atractiva.</p>
            <Campo label="Gancho" valor={bosquejo.introduccion.gancho} onChange={v => actualizarIntro('gancho', v)}
              placeholder="Una pregunta, historia o dato relevante para captar la atención inmediata..."
              multiline rows={3} color="#60A5FA" hint="¿Qué hará que la audiencia quiera seguir escuchando?" />
            <Campo label="Contexto histórico" valor={bosquejo.introduccion.contexto} onChange={v => actualizarIntro('contexto', v)}
              placeholder="Breve explicación del trasfondo histórico o literario del pasaje..."
              multiline rows={3} color="#FB923C" hint="¿Quién escribió esto? ¿A quién? ¿En qué situación?" />
            <Campo label="Oración de transición" valor={bosquejo.introduccion.transicion} onChange={v => actualizarIntro('transicion', v)}
              placeholder="El puente natural que conecta la introducción con el cuerpo del mensaje..."
              multiline rows={2} color="#34D399" hint="Lleva al oyente del 'gancho' al primer punto" />
          </div>
        )}

        {/* SECCIÓN: DESARROLLO */}
        {seccion === 'desarrollo' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300, marginBottom: 4 }}>Desarrollo</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>2 a 4 puntos principales que respaldan la proposición.</p>
              </div>
              <button onClick={agregarPunto} style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', background: 'var(--gold-glow)', border: '1px solid var(--gold-dim)', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.05em',
              }}>+ Agregar punto</button>
            </div>

            {bosquejo.puntos.map((p, i) => (
              <PuntoPrincipal
                key={p.id} punto={p} num={i + 1}
                onChange={datos => actualizarPunto(p.id, datos)}
                onDelete={() => eliminarPunto(p.id)}
                onAddCita={() => abrirBuscadorCita(p.id)}
              />
            ))}
          </div>
        )}

        {/* SECCIÓN: CONCLUSIÓN */}
        {seccion === 'conclusion' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300 }}>Conclusión</h2>
              <ClipNotas label="Conclusión" notas={bosquejo.conclusion.notas || []} onChange={v => actualizarConclusion('notas', v)} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Cierra el mensaje y desafía a la congregación. ~10% del tiempo total.</p>
            <Campo label="Resumen" valor={bosquejo.conclusion.resumen} onChange={v => actualizarConclusion('resumen', v)}
              placeholder="Un repaso breve de los puntos principales tratados..."
              multiline rows={3} color="#60A5FA" />
            <Campo label="Llamado a la acción" valor={bosquejo.conclusion.llamado} onChange={v => actualizarConclusion('llamado', v)}
              placeholder="Exhortación directa que motiva a la audiencia a poner en práctica lo aprendido..."
              multiline rows={3} color="#34D399" hint="¿Qué decisión o acción quieres que tomen hoy?" />
            <Campo label="Oración final" valor={bosquejo.conclusion.oracion} onChange={v => actualizarConclusion('oracion', v)}
              placeholder="Una petición a Dios para sellar el mensaje y dar fuerza a la congregación..."
              multiline rows={3} color="#A78BFA" />
          </div>
        )}

        {/* SECCIÓN: NOTAS */}
        {seccion === 'notas' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--crimson)', fontSize: 28, color: 'var(--gold)', fontWeight: 300, marginBottom: 4 }}>Notas paralelas</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ideas, recordatorios, citas adicionales o apuntes de preparación.</p>
              </div>
              <button onClick={agregarNota} style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', background: 'var(--gold-glow)', border: '1px solid var(--gold-dim)', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.05em',
              }}>+ Agregar nota</button>
            </div>

            {bosquejo.notas.length === 0 && (
              <div className="empty">No hay notas todavía — agrega una para comenzar</div>
            )}

            {bosquejo.notas.map((n, i) => (
              <NotaFlotante
                key={n.id} nota={n}
                onChange={nueva => setBosquejo(prev => ({ ...prev, notas: prev.notas.map((x, j) => j === i ? nueva : x) }))}
                onDelete={() => setBosquejo(prev => ({ ...prev, notas: prev.notas.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── BUSCADOR DE CITAS ─── */}
      {showCitas && (
        <BuscadorCitas
          onAgregar={agregarCita}
          onCerrar={() => { setShowCitas(false); setCitaTarget(null) }}
        />
      )}

      {/* ─── VISTA PREVIA ─── */}
      {showPrevia && <VistaPrevia bosquejo={bosquejo} onCerrar={() => setShowPrevia(false)} />}

      {/* ─── LISTA DE BOSQUEJOS ─── */}
      {showLista && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,10,0.9)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowLista(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em' }}>MIS BOSQUEJOS</span>
              <button onClick={() => setShowLista(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {listaBosquejos.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>No hay bosquejos guardados</div>}
              {listaBosquejos.map(b => (
                <div key={b.id} onClick={() => { cargarBosquejoById(b.id).then(d => { if (d) setBosquejo(d); setShowLista(false) }) }}
                  style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontFamily: 'var(--crimson)', fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{b.titulo || 'Sin título'}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    {new Date(b.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setBosquejo({ ...BOSQUEJO_INICIAL, puntos: [{ id: uid(), titulo: '', explicacion: '', ilustracion: '', aplicacion: '', subpuntos: [], citas: [], notas: [] }] }); setShowLista(false) }} className="btn-secondary" style={{ fontSize: 10, width: '100%' }}>
                + Nuevo bosquejo en blanco
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}