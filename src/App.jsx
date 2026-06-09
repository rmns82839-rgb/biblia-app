import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home.jsx'
import Reader from './pages/Reader.jsx'
import Search from './pages/Search.jsx'
import Sidebar from './components/Sidebar.jsx'

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="app">
      {/* ─── TOPBAR ─── */}
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
          <NavLink to="/leer/1/1">Leer</NavLink>
          <NavLink to="/buscar">Buscar</NavLink>
        </nav>
      </header>

      {/* ─── BODY ─── */}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<Search />} />
          <Route
            path="/leer/:libroId/:capituloNum"
            element={
              <>
                <Sidebar />
                <Reader />
              </>
            }
          />
          <Route
            path="/leer/:libroId"
            element={
              <>
                <Sidebar />
                <Reader />
              </>
            }
          />
        </Routes>
      </div>
    </div>
  )
}
