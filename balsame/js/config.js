// ── Icon set ───────────────────────────────────────────────────────────
const ICONS = [
  '⌂','☰','◀','▶','↑','↓','←','→',
  '✎','🗑','✕','✓','＋','↺','↻','⇪',
  '👤','👥','🔒','🔓','⚙','✉','🔔','💬',
  '📁','📄','💾','📋','🔗','📤','📥','📊',
  '✅','❌','⚠','ℹ','⭐','❤','💡','🔍',
  '📱','💻','🖨','🌐','📅','🏷','📌','📈',
];

// Inline editable property per component type
const INLINE_PROP = {
  lbl:'label', h1:'label', btn:'label', badge:'label', box:'label',
  inp:'ph', ta:'ph', num:'ph', date:'ph', search:'ph',
  alert:'label', card:'label', nav:'logo', prog:'label',
};

// Type display names
const TN = {
  lbl:'Etiqueta', h1:'Título', inp:'Texto', num:'Número', ta:'Área',
  sel:'Desplegable', chk:'Checkbox', rad:'Radio', date:'Fecha',
  slide:'Slider', search:'Búsqueda', btn:'Botón', badge:'Badge',
  alert:'Alerta', tbl:'Tabla', prog:'Progreso', pgn:'Paginación',
  card:'Card', arr:'Flecha', icon:'Ícono', nav:'Nav Bar',
  imgph:'Imagen', box:'Zona', sep:'Separador',
};

// Thumbnail colors per type
const TCLR = {
  btn:'#4a7af7', badge:'#22c55e', h1:'#8888cc', tbl:'#7eaad0',
  box:'#a8c0de', arr:'#e94560', card:'#88aadd', sel:'#9090bb',
  slide:'#f59e0b', chk:'#66aa88', rad:'#66aa88', prog:'#4a7af7',
  nav:'#334466', imgph:'#aaaaaa', alert:'#f59e0b', pgn:'#8888bb',
  search:'#7eaad0', icon:'#f59e0b',
};

// Thumbnail scale factor (120px wide thumb / 960px canvas)
const sc = 108 / 960;

// Default properties per component type (standardised 8px grid)
const D = {
  lbl:   {w:130, h:24,  label:'Etiqueta', bg:'transparent', tc:'#333333', fs:13},
  h1:    {w:280, h:40,  label:'Título de Sección', bg:'transparent', tc:'#1a1a2e', fs:22, fw:700},
  inp:   {w:200, h:32,  ph:'Ingrese texto...', bg:'#ffffff', tc:'#aaaaaa'},
  num:   {w:120, h:32,  ph:'0', bg:'#ffffff', tc:'#aaaaaa'},
  ta:    {w:220, h:88,  ph:'Descripción...', bg:'#ffffff', tc:'#aaaaaa'},
  sel:   {w:200, h:32,  opts:'Opción 1\nOpción 2\nOpción 3', si:0, bg:'#ffffff', tc:'#444444', arrbg:'#e8eaee'},
  chk:   {w:160, h:24,  label:'Opción activa', checked:false, bg:'transparent', tc:'#333333'},
  rad:   {w:150, h:80,  opts:'Opción A\nOpción B\nOpción C', si:0, bg:'transparent', tc:'#333333'},
  date:  {w:180, h:32,  ph:'dd/mm/aaaa', bg:'#ffffff', tc:'#aaaaaa'},
  slide: {w:220, h:56,  label:'', min:0, max:100, val:60, ac:'#7c6af7', trackbg:'#e0e0e0', bg:'transparent', tc:'#555555', showlimits:true},
  search:{w:280, h:32,  ph:'Buscar...', btnlabel:'Buscar', bg:'#ffffff', tc:'#aaaaaa', btnbg:'#4a7af7', btnc:'#ffffff'},
  btn:   {w:120, h:32,  label:'Guardar', bg:'#4a7af7', tc:'#ffffff', fs:13, br:4},
  badge: {w:72,  h:24,  label:'Activo', bg:'#22c55e', tc:'#ffffff', fs:11},
  alert: {w:320, h:44,  label:'Mensaje de alerta aquí', variant:'info', bg:'', bc:'', tc:''},
  tbl:   {w:460, h:228, rows:4, cols:3, hdrs:'ID\nNombre\nEstado',
          bg:'#ffffff', tc:'#333333', hbg:'#e8eaf0', hc:'#333333',
          striped:true, sbg:'#f5f6fa', bcolor:'#d0d4da', balign:'left',
          fsize:12, density:'spacious', shownums:false, showtotal:false,
          totalrow:'Total', totalbg:'#fffbe6'},
  prog:  {w:260, h:48,  label:'Progreso', val:65, ac:'#4a7af7', trackbg:'#e5e7eb', showval:true, bg:'transparent', tc:'#444444'},
  pgn:   {w:260, h:32,  total:5, si:2, ac:'#4a7af7', tc:'#555555', bg:'transparent'},
  card:  {w:240, h:160, label:'Tarjeta', body:'Contenido...', bg:'#ffffff', tc:'#333333', hbg:'#f5f6fa'},
  arr:   {w:180, h:56,  label:'', dir:'right', ac:'#e94560', lw:2, dashed:false, bidir:false, bg:'transparent', tc:'#444444', fs:11},
  nav:   {w:640, h:48,  logo:'Logo', items:'Inicio\nProductos\nServicios\nContacto', si:0, bg:'#ffffff', tc:'#555555', ac:'#4a7af7', lc:'#1a1a2e'},
  imgph: {w:200, h:150, label:'', bg:'#f0f0f0', bc:'#cccccc', lc:'#cccccc', tc:'#888888'},
  icon:  {w:40,  h:40,  icon:'⭐', bg:'transparent', tc:'#555555', fs:24},
  box:   {w:280, h:160, label:'Zona', bg:'#f0f4ff', tc:'#8899cc', bc:'#b0bfdf', bs:'dashed', bw:2},
  sep:   {w:300, h:14,  lc:'#dddddd', ls:'solid', lw:2, bg:'transparent', tc:'#333333'},
};
