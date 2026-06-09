// ─── RESALTADOR BÍBLICO ──────────────────────────────────────
// Resalta automáticamente: nombres de Dios, números bíblicos,
// nombres de ángeles, términos mesiánicos y palabras clave

// ─── NOMBRES DE DIOS (dorado) ───────────────────────────────
const NOMBRES_DIOS = [
  'Jehová', 'Jehovah',
  'Dios', 'DIOS',
  'Señor', 'SEÑOR',
  'El Shaddai', 'Shaddai',
  'El Elyon', 'Elyon',
  'Adonai',
  'El Eterno', 'Eterno',
  'Todopoderoso',
  'Santo de Israel',
  'Altísimo',
  'El Omnipotente',
  'YO SOY',
  'Alpha', 'Omega',
  'Padre',
]

// ─── NOMBRES DE JESÚS (rojo suave) ─────────────────────────
const NOMBRES_JESUS = [
  'Jesús', 'Jesus',
  'Cristo', 'Jesucristo',
  'Emanuel', 'Emmanuel',
  'Mesías', 'Mesias',
  'Hijo de Dios',
  'Hijo del Hombre',
  'Cordero de Dios',
  'Cordero',
  'Salvador',
  'Redentor',
  'Príncipe de paz',
  'Verbo',
]

// ─── ÁNGELES Y SERES CELESTIALES (azul claro) ───────────────
const ANGELES = [
  'Miguel', 'Arcángel',
  'Gabriel',
  'Querubín', 'querubín', 'querubines',
  'Serafín', 'serafines',
  'ángel', 'Ángel', 'ángeles', 'Ángeles',
  'hueste celestial', 'ejércitos celestiales',
]

// ─── NÚMEROS BÍBLICOS SIGNIFICATIVOS (púrpura) ──────────────
// Solo números cuando aparecen como palabras o en contexto bíblico
const NUMEROS_PALABRAS = [
  '\\bsiete\\b', '\\bséptimo\\b', '\\bséptima\\b',
  '\\bdoce\\b', '\\bduodécimo\\b',
  '\\bcuarenta\\b',
  '\\bsetenta\\b',
  '\\bcuarenta y dos\\b',
  '\\bsesenta y seis\\b',
  '\\btres días\\b', '\\btres noches\\b',
  '\\bseis días\\b',
  '\\bmil años\\b',
  '\\bciento cuarenta y cuatro mil\\b',
  '\\bseptuagésimo\\b',
  '\\btres años\\b',
  '\\bsiete años\\b',
  '\\bdoce tribus\\b',
  '\\bdoce apóstoles\\b',
]

// ─── TÉRMINOS PROFÉTICOS (verde esmeralda) ──────────────────
const PROFECIAS = [
  'profecía', 'profecia', 'profetizó', 'profetizo',
  'visión', 'vision',
  'sueño',
  'señal',
  'cumplirá', 'cumplió', 'se cumplió',
  'como está escrito',
  'dice Jehová',
  'así dice',
  'palabra de Jehová',
  'oráculo',
]

// ─── FUNCIÓN PRINCIPAL ──────────────────────────────────────
export function resaltarTexto(texto, opciones = {}) {
  const {
    dios     = true,
    jesus    = true,
    angeles  = true,
    numeros  = true,
    profecias = true,
  } = opciones

  // Dividimos en tokens para no romper palabras parciales
  let segmentos = [{ texto, tipo: null }]

  function aplicar(lista, tipo) {
    const nuevos = []
    for (const seg of segmentos) {
      if (seg.tipo !== null) { nuevos.push(seg); continue }
      const partes = dividirPorLista(seg.texto, lista, tipo)
      nuevos.push(...partes)
    }
    segmentos = nuevos
  }

  if (dios)      aplicar(NOMBRES_DIOS,      'dios')
  if (jesus)     aplicar(NOMBRES_JESUS,     'jesus')
  if (angeles)   aplicar(ANGELES,           'angel')
  if (numeros)   aplicar(NUMEROS_PALABRAS,  'numero')
  if (profecias) aplicar(PROFECIAS,         'profecia')

  return segmentos
}

function dividirPorLista(texto, lista, tipo) {
  // Construir regex con todas las palabras de la lista
  const pattern = lista
    .map(p => p.startsWith('\\b') ? p : `\\b${escapeRegex(p)}\\b`)
    .join('|')

  const re = new RegExp(`(${pattern})`, 'gi')
  const partes = texto.split(re)

  return partes
    .filter(p => p !== '')
    .map(p => ({
      texto: p,
      tipo: re.test(p) ? tipo : null,
    }))
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}