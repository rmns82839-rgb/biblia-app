import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEstadisticasGlobales } from '../lib/db.js'
import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

async function getContadoresGlobales() {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*) FROM palabras_jesus)                                           AS palabras_jesus,
      (SELECT COUNT(*) FROM profecias_mesianicas)                                     AS profecias_mesianicas,
      (SELECT COUNT(*) FROM juicios_jehova WHERE estado = 'cumplido')                 AS juicios_cumplidos,
      (SELECT COUNT(*) FROM juicios_jehova WHERE estado = 'por_cumplirse')            AS juicios_pendientes,
      (SELECT COUNT(*) FROM juicios_jehova WHERE estado = 'cumplimiento_parcial')     AS juicios_parciales,
      (SELECT COUNT(DISTINCT libro_id) FROM palabras_jesus pj
       JOIN versiculos v ON pj.versiculo_id = v.id)                                   AS libros_con_jesus
  `
  return rows[0]
}

export default function Home() {
  const [stats, setStats]       = useState(null)
  const [contadores, setContadores] = useState(null)

  useEffect(() => {
    getEstadisticasGlobales().then(setStats).catch(console.error)
    getContadoresGlobales().then(setContadores).catch(console.error)
  }, [])

  function fmt(n) {
    if (n === null || n === undefined) return '...'
    return Number(n).toLocaleString('es-CO')
  }

  const bloques = [
    {
      icon: '🔴',
      titulo: 'Palabras de Jesús',
      valor: fmt(contadores?.palabras_jesus),
      sub: `en ${fmt(contadores?.libros_con_jesus)} libros`,
      color: '#E07070',
      desc: 'Versículos donde Jesús habla directamente, narra parábolas, ora o aparece resucitado.',
      to: '/especiales',
      cta: 'Ver todos →',
    },
    {
      icon: '🟠',
      titulo: 'Profecías Mesiánicas',
      valor: fmt(contadores?.profecias_mesianicas),
      sub: 'del Antiguo Testamento',
      color: '#FB923C',
      desc: 'Versículos proféticos sobre el Mesías identificados por teólogos, con su cumplimiento en el NT.',
      to: '/especiales',
      cta: 'Ver todas →',
    },
    {
      icon: '✅',
      titulo: 'Juicios Cumplidos',
      valor: fmt(contadores?.juicios_cumplidos),
      sub: 'verificados históricamente',
      color: '#34D399',
      desc: 'Juicios de Jehová anunciados en la Biblia que ya se cumplieron en la historia.',
      to: '/especiales',
      cta: 'Ver todos →',
    },
    {
      icon: '⏳',
      titulo: 'Juicios Pendientes',
      valor: fmt(contadores?.juicios_pendientes),
      sub: 'aún por cumplirse',
      color: '#F87171',
      desc: 'Juicios proféticos que según las Escrituras aún están por cumplirse en el tiempo del fin.',
      to: '/especiales',
      cta: 'Ver todos →',
    },
    {
      icon: '🔶',
      titulo: 'Cumplimiento Parcial',
      valor: fmt(contadores?.juicios_parciales),
      sub: 'iniciados, pendientes de plenitud',
      color: '#FBBF24',
      desc: 'Juicios y profecías con cumplimiento inicial pero con plenitud futura aún pendiente.',
      to: '/especiales',
      cta: 'Ver todos →',
    },
  ]

  return (
    <main className="home fade-in" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>

      {/* ─── HERO ─── */}
      <p className="home-subtitle" style={{ textAlign: 'center', width: '100%' }}>Reina Valera 1960 · Edición de Estudio</p>
      <h1 className="home-title" style={{ textAlign: 'center', width: '100%' }}>La Palabra<br /><span style={{ background: 'linear-gradient(135deg,#C9A84C,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>de Dios</span></h1>

      {/* ─── STATS GLOBALES ─── */}
      <div className="home-stats" style={{ justifyContent: 'center', width: '100%', marginBottom: 48 }}>
        {[
          { num: '66',              label: 'Libros' },
          { num: fmt(stats?.total_capitulos),  label: 'Capítulos' },
          { num: fmt(stats?.total_versiculos), label: 'Versículos' },
          { num: fmt(stats?.total_palabras),   label: 'Palabras' },
        ].map(s => (
          <div key={s.label} className="home-stat">
            <span className="home-stat-num">{s.num}</span>
            <span className="home-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── CTA BUTTONS ─── */}
      <div className="home-cta" style={{ justifyContent: 'center', width: '100%', marginBottom: 56 }}>
        <Link to="/leer/1" className="btn-primary">Comenzar a leer</Link>
        <Link to="/buscar" className="btn-secondary">Buscar versículo</Link>
      </div>

      {/* ─── BLOQUES ESPECIALES ─── */}
      <div style={{ width: '100%', marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          Contenido marcado en la Biblia
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {bloques.map(b => (
            <div key={b.titulo} style={{
              background: 'var(--surface)',
              border: `1px solid ${b.color}30`,
              borderRadius: 'var(--radius)',
              padding: '20px',
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${b.color}30`; e.currentTarget.style.transform = 'none' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 14, color: b.color }}>{b.titulo}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{b.sub}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--crimson)', fontSize: 32, color: b.color, lineHeight: 1 }}>
                  {b.valor}
                </div>
              </div>

              {/* Descripción */}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>

              {/* CTA */}
              <Link to={b.to} style={{
                fontFamily: 'var(--mono)', fontSize: 10,
                color: b.color, textDecoration: 'none',
                letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {b.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MÓDULOS ─── */}
      <div style={{ width: '100%' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          Módulos de la app
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { icon: '📖', label: 'Lector',       desc: 'Navega los 66 libros',         to: '/leer/1',   active: true },
            { icon: '🔍', label: 'Buscador',      desc: 'Busca en toda la Biblia',      to: '/buscar',   active: true },
            { icon: '📊', label: 'Patrones',      desc: 'Análisis de frecuencias',      to: '/patrones', active: true  },
            { icon: '🕊️', label: 'Angelología',  desc: 'Ángeles en la Biblia',         to: '/angeles',  active: true  },
            { icon: '✝️', label: 'Cristología',   desc: 'Referencias mesiánicas',       to: '/cristologia', active: true },
            { icon: '👑', label: 'Reyes',         desc: 'Línea de tiempo real',         to: '/reyes',    active: true  },
            { icon: '🔢', label: 'Numerología',   desc: 'Números bíblicos',             to: '/numerologia', active: true },
            { icon: '📝', label: 'Bosquejos',     desc: 'Crea tu sermón',               to: '/bosquejos',    active: true  },
            { icon: '🕊️', label: 'Neumatología', desc: 'El Espíritu Santo en la Biblia', to: '/neumatologia', active: true  },
          ].map(m => (
            <Link key={m.label} to={m.to} style={{
              background: 'var(--surface)',
              border: `1px solid ${m.active ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '16px', textDecoration: 'none',
              opacity: m.active ? 1 : 0.5,
              cursor: m.active ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                {m.label}
                {!m.active && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 6, letterSpacing: '0.06em' }}>PRONTO</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}