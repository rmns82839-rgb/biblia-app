import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Home        from './pages/Home.jsx'
import Reader      from './pages/Reader.jsx'
import Search      from './pages/Search.jsx'
import Patrones    from './pages/Patrones.jsx'
import Especiales  from './pages/Especiales.jsx'
import Reyes       from './pages/Reyes.jsx'
import Angelologia from './pages/Angelologia.jsx'
import Cristologia from './pages/Cristologia.jsx'
import Numerologia from './pages/Numerologia.jsx'
import Bosquejos    from './pages/Bosquejos.jsx'
import Neumatologia from './pages/Neumatologia.jsx'
import Sidebar     from './components/Sidebar.jsx'

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate  = useNavigate()
  const location  = useLocation()

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="topbar-logo">
          ✦ BibleApp <span>RV1960</span>
        </NavLink>
        <form className="topbar-search" onSubmit={handleSearch}>
          <span className="topbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Buscar versículo, palabra..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>
        <nav className="topbar-nav">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/leer/1">Leer</NavLink>
          <NavLink to="/buscar">Buscar</NavLink>
          <NavLink to="/patrones">Patrones</NavLink>
          <NavLink to="/especiales">Estudios</NavLink>
          <NavLink to="/reyes">Reyes</NavLink>
          <NavLink to="/angeles">Ángeles</NavLink>
          <NavLink to="/cristologia">Cristología</NavLink>
          <NavLink to="/numerologia">Números</NavLink>
          <NavLink to="/bosquejos">Bosquejos</NavLink>
          <NavLink to="/neumatologia">Espíritu</NavLink>
        </nav>
      </header>

      <div className="content">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/buscar"      element={<Search />} />
          <Route path="/patrones"    element={<Patrones />} />
          <Route path="/especiales"  element={<Especiales />} />
          <Route path="/reyes"       element={<Reyes />} />
          <Route path="/angeles"     element={<Angelologia />} />
          <Route path="/cristologia" element={<Cristologia />} />
          <Route path="/numerologia" element={<Numerologia />} />
          <Route path="/bosquejos"    element={<Bosquejos />} />
          <Route path="/neumatologia" element={<Neumatologia />} />
          <Route path="/leer/:libroId"             element={<><Sidebar /><Reader /></>} />
          <Route path="/leer/:libroId/:capituloNum" element={<><Sidebar /><Reader /></>} />
        </Routes>
      </div>

      {/* ─── BARRA INFERIOR MÓVIL ─── */}
      <nav className="mobile-nav">
        <NavLink to="/" end><span className="icon">🏠</span>Inicio</NavLink>
        <NavLink to="/leer/1"><span className="icon">📖</span>Leer</NavLink>
        <NavLink to="/buscar"><span className="icon">🔍</span>Buscar</NavLink>
        <NavLink to="/especiales"><span className="icon">✦</span>Estudios</NavLink>
        <NavLink to="/bosquejos"><span className="icon">📝</span>Bosquejos</NavLink>
        <NavLink to="/patrones"><span className="icon">📊</span>Patrones</NavLink>
      </nav>
    </div>
  )
}