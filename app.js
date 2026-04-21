/* ============================================================
   ALITAS LEGENDARIAS · SISTEMA DE INVENTARIO
   Lógica principal
   ============================================================ */

// ============ UTILIDADES ============
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => Math.random().toString(36).substring(2, 11);
const fmt = (n) => Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('es-EC');
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[+m - 1]} ${y}`;
};

// Hash simple para passwords (NO es seguridad real, solo evita guardar texto plano en localStorage)
const hashPass = async (str) => {
  const buf = new TextEncoder().encode(str + 'alitas-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============ STORAGE ============
const DB = {
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem('alitas:' + key)) ?? def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem('alitas:' + key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem('alitas:' + key); }
};

// ============ TOAST ============
function toast(msg, type = 'info') {
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'ℹ'
  };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ============ MODAL ============
const Modal = {
  el: $('#modal'),
  title: $('#modal-title'),
  body: $('#modal-body'),
  footer: $('#modal-footer'),
  open({ title, body, footer, size }) {
    this.title.textContent = title;
    if (body instanceof Node) { this.body.innerHTML = ''; this.body.appendChild(body); }
    else this.body.innerHTML = body || '';
    this.footer.innerHTML = '';
    (footer || []).forEach(btn => this.footer.appendChild(btn));
    const dlg = this.el.querySelector('.modal-dialog');
    dlg.style.maxWidth = size === 'lg' ? '720px' : '500px';
    this.el.classList.remove('hidden');
  },
  close() { this.el.classList.add('hidden'); }
};
$('#modal-close').onclick = () => Modal.close();
$('#modal .modal-backdrop').onclick = () => Modal.close();
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !Modal.el.classList.contains('hidden')) Modal.close();
});

// ============ CATÁLOGO DE PRODUCTOS POR DEFECTO ============
// Basado en el formato físico: agrupado por categorías
const DEFAULT_PRODUCTS = [
  // Alimentos principales
  { id: 'p01', nombre: 'Alas',           categoria: 'Alimentos',  unidad: 'unid', minStock: 500, orden: 1,  activo: true },
  { id: 'p02', nombre: 'Salchichas',     categoria: 'Alimentos',  unidad: 'unid', minStock: 30,  orden: 2,  activo: true },
  { id: 'p03', nombre: 'Hamburguesa',    categoria: 'Alimentos',  unidad: 'unid', minStock: 50,  orden: 3,  activo: true },
  { id: 'p04', nombre: 'Pan',            categoria: 'Alimentos',  unidad: 'unid', minStock: 50,  orden: 4,  activo: true },
  { id: 'p05', nombre: 'Chili',          categoria: 'Alimentos',  unidad: 'unid', minStock: 30,  orden: 5,  activo: true },
  { id: 'p06', nombre: 'Lomo',           categoria: 'Alimentos',  unidad: 'unid', minStock: 25,  orden: 6,  activo: true },
  // Bebidas
  { id: 'p07', nombre: 'Fuze Tea',       categoria: 'Bebidas',    unidad: 'unid', minStock: 25,  orden: 7,  activo: true },
  { id: 'p08', nombre: 'Cola 3 Litros',  categoria: 'Bebidas',    unidad: 'unid', minStock: 20,  orden: 8,  activo: true },
  { id: 'p09', nombre: 'Cola Vidrio',    categoria: 'Bebidas',    unidad: 'unid', minStock: 50,  orden: 9,  activo: true },
  { id: 'p10', nombre: 'Coca Cola 1.35L',categoria: 'Bebidas',    unidad: 'unid', minStock: 200, orden: 10, activo: true },
  { id: 'p11', nombre: 'Agua 500 ml',    categoria: 'Bebidas',    unidad: 'unid', minStock: 40,  orden: 11, activo: true },
  { id: 'p12', nombre: 'T. Bebida Vidrio',   categoria: 'Bebidas', unidad: 'unid', minStock: 150, orden: 12, activo: true },
  { id: 'p13', nombre: 'T. Bebida Plástico', categoria: 'Bebidas', unidad: 'unid', minStock: 150, orden: 13, activo: true },
  // Insumos adicionales
  { id: 'p14', nombre: 'Gomas',          categoria: 'Insumos',    unidad: 'unid', minStock: 50,  orden: 14, activo: true },
  { id: 'p15', nombre: 'L. Pequeño',     categoria: 'Empaques',   unidad: 'unid', minStock: 150, orden: 15, activo: true },
  { id: 'p16', nombre: 'L. Mediano',     categoria: 'Empaques',   unidad: 'unid', minStock: 150, orden: 16, activo: true },
  { id: 'p17', nombre: 'L. Grande',      categoria: 'Empaques',   unidad: 'unid', minStock: 400, orden: 17, activo: true },
  { id: 'p18', nombre: 'Huevos',         categoria: 'Alimentos',  unidad: 'unid', minStock: 20,  orden: 18, activo: true },
  { id: 'p19', nombre: 'Queso',          categoria: 'Alimentos',  unidad: 'unid', minStock: 300, orden: 19, activo: true },
  { id: 'p20', nombre: 'T. Salsero',     categoria: 'Empaques',   unidad: 'unid', minStock: 5000,orden: 20, activo: true },
  { id: 'p21', nombre: 'V. Salsero',     categoria: 'Empaques',   unidad: 'unid', minStock: 5000,orden: 21, activo: true },
  { id: 'p22', nombre: 'Vaso #7',        categoria: 'Empaques',   unidad: 'unid', minStock: 1500,orden: 22, activo: true },
  { id: 'p23', nombre: 'Costillas',      categoria: 'Alimentos',  unidad: 'unid', minStock: 20,  orden: 23, activo: true },
  { id: 'p24', nombre: 'Pastel',         categoria: 'Alimentos',  unidad: 'unid', minStock: 5,   orden: 24, activo: true },
  { id: 'p25', nombre: 'Strips',         categoria: 'Alimentos',  unidad: 'unid', minStock: 200, orden: 25, activo: true },
  { id: 'p26', nombre: 'Pan Strips',     categoria: 'Alimentos',  unidad: 'unid', minStock: 10,  orden: 26, activo: true },
];

const DEFAULT_BRANCHES = [
  { id: 'b01', nombre: 'Puyo',          ubicacion: 'Puyo, Pastaza',      activo: true },
  { id: 'b02', nombre: 'Tena',          ubicacion: 'Tena, Napo',         activo: true },
  { id: 'b03', nombre: 'Riobamba Norte',ubicacion: 'Riobamba, Chimborazo', activo: true },
  { id: 'b04', nombre: 'Riobamba Sur',  ubicacion: 'Riobamba, Chimborazo', activo: true },
  { id: 'b05', nombre: 'Riobamba Centro',ubicacion: 'Riobamba, Chimborazo',activo: true }
];

// ============ ESTADO GLOBAL ============
const State = {
  currentUser: null,
  currentBranch: null,
  currentView: 'dashboard',
  cierreData: null, // cierre en edición
};

// ============ INICIALIZACIÓN ============
async function init() {
  // Crear admin por defecto si no hay usuarios
  if (!DB.get('users')) {
    const adminHash = await hashPass('admin2026');
    DB.set('users', [{
      id: 'u01',
      username: 'admin',
      passHash: adminHash,
      nombre: 'Administrador',
      rol: 'admin',
      sucursalId: null,
      activo: true,
      createdAt: new Date().toISOString()
    }]);
  }
  if (!DB.get('products')) DB.set('products', DEFAULT_PRODUCTS);
  if (!DB.get('branches')) DB.set('branches', DEFAULT_BRANCHES);
  if (!DB.get('cierres')) DB.set('cierres', []);
  if (!DB.get('nextCierreNum')) DB.set('nextCierreNum', 1230); // continúa del 000001229 del físico

  // Verificar sesión
  const session = DB.get('session');
  if (session) {
    const users = DB.get('users', []);
    const user = users.find(u => u.id === session.userId);
    if (user && user.activo) {
      State.currentUser = user;
      showApp();
      return;
    }
  }
  showLogin();
}

// ============ LOGIN ============
function showLogin() {
  $('#login-screen').classList.remove('hidden');
  $('#app').classList.add('hidden');
  $('#login-user').focus();
}
function showApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  setupUI();
  renderAll();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#login-user').value.trim();
  const pass = $('#login-pass').value;
  const errEl = $('#login-error');
  errEl.textContent = '';

  const users = DB.get('users', []);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) { errEl.textContent = 'Usuario no encontrado'; return; }
  if (!user.activo) { errEl.textContent = 'Usuario inactivo. Contacta al administrador.'; return; }

  const hash = await hashPass(pass);
  if (hash !== user.passHash) { errEl.textContent = 'Contraseña incorrecta'; return; }

  DB.set('session', { userId: user.id, ts: Date.now() });
  State.currentUser = user;
  $('#login-form').reset();
  showApp();
  toast(`Bienvenido, ${user.nombre}`, 'success');
});

$('#btn-logout').onclick = () => {
  DB.del('session');
  State.currentUser = null;
  State.cierreData = null;
  showLogin();
};

// ============ SETUP UI ============
function setupUI() {
  const u = State.currentUser;
  $('#user-name').textContent = u.nombre;
  $('#user-role').textContent = u.rol;
  $('#user-avatar').textContent = u.nombre.charAt(0).toUpperCase();

  // Mostrar/ocultar elementos admin-only
  const isAdmin = u.rol === 'admin';
  $$('.admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin));

  // Llenar sucursales
  const branches = DB.get('branches', []).filter(b => b.activo);
  const selector = $('#branch-selector');
  selector.innerHTML = branches.map(b =>
    `<option value="${b.id}">${b.nombre}</option>`
  ).join('');

  // Establecer sucursal actual
  if (u.sucursalId) {
    selector.value = u.sucursalId;
    selector.disabled = true;
    State.currentBranch = u.sucursalId;
  } else {
    selector.disabled = false;
    State.currentBranch = branches[0]?.id;
    selector.value = State.currentBranch;
  }
  selector.onchange = () => { State.currentBranch = selector.value; renderCurrentView(); };

  // Fecha actual en breadcrumb
  const todayStr = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('#crumb-date').textContent = todayStr;
  $('#dash-today').textContent = todayStr;

  // Navegación
  $$('.nav-item').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.view);
  });
  $$('[data-navigate]').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.navigate);
  });

  // Menú móvil
  $('#mobile-menu').onclick = () => $('.sidebar').classList.toggle('open');

  // Botones de cierre diario
  $('#btn-save-cierre').onclick = saveCierre;
  $('#btn-load-previous').onclick = loadPreviousCierre;
  $('#btn-add-gasto').onclick = () => addGastoRow();
  $('#btn-add-merma').onclick = () => addMermaRow();

  // Filtros historial
  $('#filter-from').oninput = renderHistorial;
  $('#filter-to').oninput = renderHistorial;
  $('#filter-resp').oninput = renderHistorial;
  $('#btn-clear-filters').onclick = () => {
    $('#filter-from').value = '';
    $('#filter-to').value = '';
    $('#filter-resp').value = '';
    renderHistorial();
  };

  // Botones admin
  if (isAdmin) {
    $('#btn-add-user').onclick = () => openUserModal();
    $('#btn-add-branch').onclick = () => openBranchModal();
    $('#btn-add-producto').onclick = () => openProductModal();
  }
}

function navigate(view) {
  State.currentView = view;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));

  const titles = {
    dashboard: 'Panel',
    cierre: 'Cierre Diario',
    historial: 'Historial',
    productos: 'Productos',
    usuarios: 'Usuarios',
    sucursales: 'Sucursales'
  };
  $('#crumb-main').textContent = titles[view] || view;
  $('.sidebar').classList.remove('open');
  renderCurrentView();
}

function renderCurrentView() {
  const v = State.currentView;
  if (v === 'dashboard') renderDashboard();
  else if (v === 'cierre') renderCierre();
  else if (v === 'historial') renderHistorial();
  else if (v === 'productos') renderProductos();
  else if (v === 'usuarios') renderUsuarios();
  else if (v === 'sucursales') renderSucursales();
}

function renderAll() { renderCurrentView(); }

// ============ DASHBOARD ============
function renderDashboard() {
  const cierres = DB.get('cierres', []).filter(c => c.sucursalId === State.currentBranch);
  const branchName = DB.get('branches', []).find(b => b.id === State.currentBranch)?.nombre || '—';

  // Última semana
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCierres = cierres.filter(c => new Date(c.fecha) >= weekAgo);
  const totalWeek = weekCierres.reduce((s, c) => s + (+c.totalVentas || 0), 0);
  const lastCierre = cierres.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  // Descuadres en la última semana
  let totalDescuadres = 0;
  weekCierres.forEach(c => {
    (c.items || []).forEach(it => {
      if (it.cuadre !== 0 && it.cuadre !== null) totalDescuadres++;
    });
  });

  // Productos con bajo stock (basado en último cierre)
  let lowStock = [];
  if (lastCierre) {
    const products = DB.get('products', []);
    (lastCierre.items || []).forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      if (prod && it.existencias !== null && it.existencias < prod.minStock) {
        lowStock.push({ nombre: prod.nombre, existencias: it.existencias, min: prod.minStock });
      }
    });
  }

  // Stats
  $('#stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Ventas última semana</div>
      <div class="stat-value">$${fmt(totalWeek)}</div>
      <div class="stat-meta">${weekCierres.length} cierres · ${branchName}</div>
    </div>
    <div class="stat-card accent">
      <div class="stat-label">Último cierre</div>
      <div class="stat-value">${lastCierre ? '$' + fmt(lastCierre.totalVentas) : '—'}</div>
      <div class="stat-meta">${lastCierre ? fmtDate(lastCierre.fecha) + ' · ' + (lastCierre.responsable || '—') : 'Sin registros'}</div>
    </div>
    <div class="stat-card ${totalDescuadres === 0 ? 'success' : 'warning'}">
      <div class="stat-label">Descuadres (7 días)</div>
      <div class="stat-value">${totalDescuadres}</div>
      <div class="stat-meta">${totalDescuadres === 0 ? 'Todo cuadrado' : 'Requiere revisión'}</div>
    </div>
    <div class="stat-card ${lowStock.length === 0 ? '' : 'warning'}">
      <div class="stat-label">Productos bajo mínimo</div>
      <div class="stat-value">${lowStock.length}</div>
      <div class="stat-meta">Según último inventario</div>
    </div>
  `;

  // Últimos cierres
  const recent = cierres.slice(0, 5);
  $('#dash-recent').innerHTML = recent.length ?
    recent.map(c => `
      <div class="recent-item">
        <div>
          <strong>#${String(c.numero).padStart(7, '0')}</strong> · ${c.responsable || '—'}
        </div>
        <div class="recent-date">${fmtDate(c.fecha)} · <span class="mono">$${fmt(c.totalVentas)}</span></div>
      </div>
    `).join('') :
    '<div class="empty-state">No hay cierres registrados aún</div>';

  // Low stock
  $('#low-stock-count').textContent = lowStock.length;
  $('#low-stock-count').className = 'badge ' + (lowStock.length ? 'warning' : 'success');
  $('#dash-lowstock').innerHTML = lowStock.length ?
    lowStock.map(l => `
      <div class="recent-item">
        <div><strong>${l.nombre}</strong></div>
        <div class="recent-date"><span class="mono">${fmtInt(l.existencias)}</span> / min ${fmtInt(l.min)}</div>
      </div>
    `).join('') :
    '<div class="empty-state">Todos los productos sobre el mínimo</div>';
}

// ============ CIERRE DIARIO ============
function renderCierre() {
  // Inicializar datos del cierre si no existen
  if (!State.cierreData || State.cierreData.sucursalId !== State.currentBranch) {
    const products = DB.get('products', []).filter(p => p.activo).sort((a, b) => a.orden - b.orden);
    const nextNum = DB.get('nextCierreNum', 1230);
    State.cierreData = {
      id: uid(),
      numero: nextNum,
      fecha: today(),
      responsable: State.currentUser.nombre,
      sucursalId: State.currentBranch,
      items: products.map(p => ({
        productId: p.id,
        invInicial: null,
        ingresos: null,
        ventas: null,
        mermas: null,
        existencias: null,
      })),
      gastos: [],
      mermasDetalle: [],
      totalVentas: null
    };
  }

  $('#cierre-numero').textContent = '#' + String(State.cierreData.numero).padStart(7, '0');
  $('#cierre-fecha').value = State.cierreData.fecha;
  $('#cierre-responsable').value = State.cierreData.responsable || '';

  $('#cierre-fecha').onchange = (e) => { State.cierreData.fecha = e.target.value; };
  $('#cierre-responsable').oninput = (e) => { State.cierreData.responsable = e.target.value; };

  // Renderizar tabla
  renderInvTable();
  renderGastos();
  renderMermas();
  updateCuadreStatus();

  const totalInput = $('#cierre-total-ventas');
  totalInput.value = State.cierreData.totalVentas || '';
  totalInput.oninput = (e) => { State.cierreData.totalVentas = +e.target.value || null; };
}

function renderInvTable() {
  const products = DB.get('products', []).filter(p => p.activo).sort((a, b) => a.orden - b.orden);
  const tbody = $('#inv-tbody');
  tbody.innerHTML = '';

  // Agrupar por categoría para insertar separadores
  let lastCat = null;
  products.forEach((p, idx) => {
    if (p.categoria !== lastCat) {
      const sep = document.createElement('tr');
      sep.innerHTML = `<td colspan="9" class="separator">${p.categoria}</td>`;
      tbody.appendChild(sep);
      lastCat = p.categoria;
    }

    let item = State.cierreData.items.find(i => i.productId === p.id);
    if (!item) {
      item = { productId: p.id, invInicial: null, ingresos: null, ventas: null, mermas: null, existencias: null };
      State.cierreData.items.push(item);
    }

    const tr = document.createElement('tr');
    tr.dataset.productId = p.id;
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td><input type="number" class="inv-cell" data-field="invInicial" placeholder="—" value="${item.invInicial ?? ''}" /></td>
      <td><input type="number" class="inv-cell" data-field="ingresos" placeholder="—" value="${item.ingresos ?? ''}" /></td>
      <td><input type="number" class="inv-cell computed" data-field="total1" readonly value="${computeTotal1(item) ?? ''}" /></td>
      <td><input type="number" class="inv-cell" data-field="ventas" placeholder="—" value="${item.ventas ?? ''}" /></td>
      <td><input type="number" class="inv-cell" data-field="mermas" placeholder="—" value="${item.mermas ?? ''}" /></td>
      <td><input type="number" class="inv-cell" data-field="existencias" placeholder="—" value="${item.existencias ?? ''}" /></td>
      <td><input type="number" class="inv-cell computed" data-field="total2" readonly value="${computeTotal2(item) ?? ''}" /></td>
      <td class="cuadre-cell" data-cuadre>${renderCuadreCell(item)}</td>
    `;
    tbody.appendChild(tr);

    // Listeners
    tr.querySelectorAll('input:not([readonly])').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.dataset.field;
        item[field] = input.value === '' ? null : +input.value;
        updateRowComputed(tr, item);
        updateCuadreStatus();
      });
    });
  });
}

function computeTotal1(item) {
  if (item.invInicial === null && item.ingresos === null) return null;
  return (+item.invInicial || 0) + (+item.ingresos || 0);
}

function computeTotal2(item) {
  if (item.ventas === null && item.mermas === null && item.existencias === null) return null;
  return (+item.ventas || 0) + (+item.mermas || 0) + (+item.existencias || 0);
}

function computeCuadre(item) {
  const t1 = computeTotal1(item);
  const t2 = computeTotal2(item);
  if (t1 === null || t2 === null) return null;
  return t1 - t2;
}

function renderCuadreCell(item) {
  const c = computeCuadre(item);
  item.cuadre = c;
  if (c === null) return '<span style="color: var(--ink-mute)">—</span>';
  if (c === 0) return '<span class="check">✓</span>';
  return `<span class="${c > 0 ? 'error' : 'error'}">${c > 0 ? '+' : ''}${c}</span>`;
}

function updateRowComputed(tr, item) {
  tr.querySelector('[data-field="total1"]').value = computeTotal1(item) ?? '';
  tr.querySelector('[data-field="total2"]').value = computeTotal2(item) ?? '';
  const cuadreCell = tr.querySelector('[data-cuadre]');
  cuadreCell.innerHTML = renderCuadreCell(item);
  cuadreCell.className = 'cuadre-cell';
  if (item.cuadre === 0) cuadreCell.classList.add('ok');
  else if (item.cuadre !== null) cuadreCell.classList.add('error');
}

function updateCuadreStatus() {
  const items = State.cierreData.items;
  const filled = items.filter(i => computeCuadre(i) !== null);
  const descuadres = filled.filter(i => i.cuadre !== 0);
  const statusEl = $('#cuadre-status');

  if (filled.length === 0) {
    statusEl.className = 'meta-value cuadre-status';
    statusEl.innerHTML = '<span class="dot"></span><span>Sin datos</span>';
  } else if (descuadres.length === 0) {
    statusEl.className = 'meta-value cuadre-status ok';
    statusEl.innerHTML = `<span class="dot"></span><span>Cuadrado · ${filled.length} productos</span>`;
  } else {
    statusEl.className = 'meta-value cuadre-status error';
    statusEl.innerHTML = `<span class="dot"></span><span>${descuadres.length} descuadre${descuadres.length > 1 ? 's' : ''}</span>`;
  }
}

// Gastos
function renderGastos() {
  const list = $('#gastos-list');
  list.innerHTML = '';
  State.cierreData.gastos.forEach((g, idx) => {
    list.appendChild(buildGastoRow(g, idx));
  });
  updateGastosTotal();
}

function buildGastoRow(gasto, idx) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" placeholder="Concepto del gasto" value="${gasto.descripcion || ''}" />
    <input type="number" step="0.01" placeholder="0.00" value="${gasto.monto ?? ''}" />
    <button class="item-remove" title="Eliminar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  const [descInput, montoInput, remBtn] = row.children;
  descInput.oninput = () => { gasto.descripcion = descInput.value; };
  montoInput.oninput = () => { gasto.monto = +montoInput.value || 0; updateGastosTotal(); };
  remBtn.onclick = () => {
    State.cierreData.gastos.splice(idx, 1);
    renderGastos();
  };
  return row;
}

function addGastoRow() {
  State.cierreData.gastos.push({ descripcion: '', monto: null });
  renderGastos();
  $('#gastos-list').lastElementChild.querySelector('input[type="text"]').focus();
}

function updateGastosTotal() {
  const total = State.cierreData.gastos.reduce((s, g) => s + (+g.monto || 0), 0);
  $('#gastos-total').textContent = '$ ' + fmt(total);
}

// Mermas
function renderMermas() {
  const list = $('#mermas-list');
  list.innerHTML = '';
  State.cierreData.mermasDetalle.forEach((m, idx) => {
    list.appendChild(buildMermaRow(m, idx));
  });
  updateMermasTotal();
}

function buildMermaRow(merma, idx) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" placeholder="Descripción (ej. Pastel prueba)" value="${merma.descripcion || ''}" />
    <input type="number" placeholder="0" value="${merma.cantidad ?? ''}" />
    <button class="item-remove" title="Eliminar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  const [descInput, cantInput, remBtn] = row.children;
  descInput.oninput = () => { merma.descripcion = descInput.value; };
  cantInput.oninput = () => { merma.cantidad = +cantInput.value || 0; updateMermasTotal(); };
  remBtn.onclick = () => {
    State.cierreData.mermasDetalle.splice(idx, 1);
    renderMermas();
  };
  return row;
}

function addMermaRow() {
  State.cierreData.mermasDetalle.push({ descripcion: '', cantidad: null });
  renderMermas();
  $('#mermas-list').lastElementChild.querySelector('input[type="text"]').focus();
}

function updateMermasTotal() {
  const total = State.cierreData.mermasDetalle.reduce((s, m) => s + (+m.cantidad || 0), 0);
  $('#mermas-total').textContent = fmtInt(total);
}

// Guardar cierre
function saveCierre() {
  const data = State.cierreData;
  if (!data.fecha) { toast('Selecciona una fecha', 'error'); return; }
  if (!data.responsable) { toast('Ingresa el responsable', 'error'); return; }

  const items = data.items.filter(i => computeCuadre(i) !== null);
  if (items.length === 0) {
    toast('Ingresa al menos un producto antes de guardar', 'error');
    return;
  }

  // Computar cuadres finales
  data.items.forEach(i => { i.cuadre = computeCuadre(i); });

  const cierres = DB.get('cierres', []);
  const existingIdx = cierres.findIndex(c => c.id === data.id);
  const toSave = {
    ...data,
    savedAt: new Date().toISOString(),
    savedBy: State.currentUser.username
  };
  if (existingIdx >= 0) {
    cierres[existingIdx] = toSave;
  } else {
    cierres.unshift(toSave);
    DB.set('nextCierreNum', data.numero + 1);
  }
  DB.set('cierres', cierres);

  toast(`Cierre #${String(data.numero).padStart(7, '0')} guardado`, 'success');

  // Reset para nuevo cierre
  State.cierreData = null;
  renderCierre();
}

function loadPreviousCierre() {
  const cierres = DB.get('cierres', []).filter(c => c.sucursalId === State.currentBranch);
  if (cierres.length === 0) {
    toast('No hay cierres anteriores en esta sucursal', 'warning');
    return;
  }
  const last = cierres.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  // Precargar: las existencias del último cierre pasan a inv. inicial del nuevo
  const nextNum = DB.get('nextCierreNum', 1230);
  const products = DB.get('products', []).filter(p => p.activo).sort((a, b) => a.orden - b.orden);

  State.cierreData = {
    id: uid(),
    numero: State.cierreData?.numero || nextNum,
    fecha: today(),
    responsable: State.currentUser.nombre,
    sucursalId: State.currentBranch,
    items: products.map(p => {
      const prevItem = last.items.find(i => i.productId === p.id);
      return {
        productId: p.id,
        invInicial: prevItem?.existencias ?? null,
        ingresos: null,
        ventas: null,
        mermas: null,
        existencias: null
      };
    }),
    gastos: [],
    mermasDetalle: [],
    totalVentas: null
  };
  renderCierre();
  toast(`Inventario inicial cargado del cierre #${String(last.numero).padStart(7, '0')}`, 'success');
}

// ============ HISTORIAL ============
function renderHistorial() {
  const cierres = DB.get('cierres', []);
  const branches = DB.get('branches', []);

  // Filtros
  const from = $('#filter-from').value;
  const to = $('#filter-to').value;
  const resp = $('#filter-resp').value.toLowerCase();

  let filtered = cierres;
  // Restricción por sucursal si el usuario no es admin
  if (State.currentUser.rol !== 'admin' && State.currentUser.sucursalId) {
    filtered = filtered.filter(c => c.sucursalId === State.currentUser.sucursalId);
  }
  if (from) filtered = filtered.filter(c => c.fecha >= from);
  if (to) filtered = filtered.filter(c => c.fecha <= to);
  if (resp) filtered = filtered.filter(c => (c.responsable || '').toLowerCase().includes(resp));

  filtered.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero - a.numero);

  const tbody = $('#hist-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 3rem; text-align: center;" class="empty-state">Sin resultados</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    const descuadres = (c.items || []).filter(i => i.cuadre !== 0 && i.cuadre !== null).length;
    const estado = descuadres === 0 ? 'ok' : 'warning';
    const estadoTxt = descuadres === 0 ? 'Cuadrado' : `${descuadres} descuadre${descuadres > 1 ? 's' : ''}`;

    return `
      <tr data-id="${c.id}">
        <td class="hist-row-num">#${String(c.numero).padStart(7, '0')}</td>
        <td>${fmtDate(c.fecha)}</td>
        <td>${branch?.nombre || '—'}</td>
        <td>${c.responsable || '—'}</td>
        <td class="mono">$${fmt(c.totalVentas)}</td>
        <td class="mono">${descuadres}</td>
        <td><span class="badge ${estado}">${estadoTxt}</span></td>
        <td><button class="btn btn-ghost btn-sm">Ver</button></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.onclick = () => viewCierreDetail(tr.dataset.id);
  });
}

function viewCierreDetail(id) {
  const cierres = DB.get('cierres', []);
  const c = cierres.find(x => x.id === id);
  if (!c) return;
  const products = DB.get('products', []);
  const branch = DB.get('branches', []).find(b => b.id === c.sucursalId);

  const rows = c.items.filter(i => computeCuadre(i) !== null).map(i => {
    const p = products.find(pp => pp.id === i.productId);
    const t1 = computeTotal1(i), t2 = computeTotal2(i);
    const cuadre = computeCuadre(i);
    return `
      <tr>
        <td>${p?.nombre || '—'}</td>
        <td class="mono">${fmtInt(i.invInicial)}</td>
        <td class="mono">${fmtInt(i.ingresos)}</td>
        <td class="mono">${fmtInt(t1)}</td>
        <td class="mono">${fmtInt(i.ventas)}</td>
        <td class="mono">${fmtInt(i.mermas)}</td>
        <td class="mono">${fmtInt(i.existencias)}</td>
        <td class="mono">${fmtInt(t2)}</td>
        <td class="mono cuadre-cell ${cuadre === 0 ? 'ok' : 'error'}">${cuadre === 0 ? '✓' : (cuadre > 0 ? '+' : '') + cuadre}</td>
      </tr>
    `;
  }).join('');

  const body = document.createElement('div');
  body.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--line);">
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em;">N° Cierre</div><div style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 600;">#${String(c.numero).padStart(7, '0')}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em;">Fecha</div><div style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 600;">${fmtDate(c.fecha)}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em;">Sucursal</div><div style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 600;">${branch?.nombre || '—'}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em;">Total ventas</div><div style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 600; color: var(--burgundy);">$${fmt(c.totalVentas)}</div></div>
    </div>
    <div style="margin: 1rem 0;"><strong>Responsable:</strong> ${c.responsable || '—'}</div>
    <div style="max-height: 400px; overflow: auto; border: 1px solid var(--line); border-radius: 6px;">
      <table class="inv-table" style="font-size: 0.82rem;">
        <thead><tr><th>Producto</th><th>Inv.I</th><th>Ing</th><th>T1</th><th>Vtas</th><th>Merma</th><th>Exist</th><th>T2</th><th>Cuadre</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${c.gastos?.length ? `
      <div style="margin-top: 1rem;">
        <strong>Gastos:</strong>
        <ul style="margin: 0.5rem 0; padding-left: 1.25rem;">
          ${c.gastos.map(g => `<li>${g.descripcion}: <span class="mono">$${fmt(g.monto)}</span></li>`).join('')}
        </ul>
      </div>
    ` : ''}
    ${c.mermasDetalle?.length ? `
      <div style="margin-top: 0.75rem;">
        <strong>Mermas:</strong>
        <ul style="margin: 0.5rem 0; padding-left: 1.25rem;">
          ${c.mermasDetalle.map(m => `<li>${m.descripcion}: <span class="mono">${fmtInt(m.cantidad)}</span></li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-ghost';
  closeBtn.textContent = 'Cerrar';
  closeBtn.onclick = () => Modal.close();

  const footer = [closeBtn];

  if (State.currentUser.rol === 'admin') {
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Eliminar';
    delBtn.onclick = () => {
      if (!confirm('¿Eliminar este cierre? Esta acción no se puede deshacer.')) return;
      const cs = DB.get('cierres', []);
      DB.set('cierres', cs.filter(x => x.id !== c.id));
      toast('Cierre eliminado', 'success');
      Modal.close();
      renderHistorial();
    };
    footer.unshift(delBtn);
  }

  Modal.open({
    title: `Cierre #${String(c.numero).padStart(7, '0')}`,
    body: body,
    footer: footer,
    size: 'lg'
  });
}

// ============ PRODUCTOS ============
function renderProductos() {
  const products = DB.get('products', []).sort((a, b) => a.orden - b.orden);
  const tbody = $('#prod-tbody');
  const isAdmin = State.currentUser.rol === 'admin';

  tbody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
      <td class="drag-handle mono">${String(p.orden).padStart(2, '0')}</td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.categoria}</td>
      <td>${p.unidad}</td>
      <td class="mono">${fmtInt(p.minStock)}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${p.activo ? 'checked' : ''} ${isAdmin ? '' : 'disabled'} data-action="toggle" />
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="action-buttons">
          ${isAdmin ? `
            <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
            <button class="btn btn-ghost btn-sm" data-action="delete" style="color: var(--danger);">Eliminar</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (isAdmin) {
    tbody.querySelectorAll('tr').forEach(tr => {
      const id = tr.dataset.id;
      tr.querySelector('[data-action="toggle"]').onchange = (e) => {
        const ps = DB.get('products', []);
        const p = ps.find(x => x.id === id);
        p.activo = e.target.checked;
        DB.set('products', ps);
        toast(`Producto ${p.activo ? 'activado' : 'desactivado'}`, 'success');
      };
      tr.querySelector('[data-action="edit"]').onclick = () => openProductModal(id);
      tr.querySelector('[data-action="delete"]').onclick = () => deleteProduct(id);
    });
  }
}

function openProductModal(id) {
  const products = DB.get('products', []);
  const p = id ? products.find(x => x.id === id) : null;
  const nextOrden = products.length ? Math.max(...products.map(x => x.orden)) + 1 : 1;

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="form-group"><label>Nombre</label><input type="text" id="pm-nombre" value="${p?.nombre || ''}" placeholder="ej. Alas" /></div>
    <div class="form-group"><label>Categoría</label>
      <select id="pm-cat">
        ${['Alimentos', 'Bebidas', 'Empaques', 'Insumos', 'Otros'].map(c =>
          `<option value="${c}" ${p?.categoria === c ? 'selected' : ''}>${c}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group"><label>Unidad</label><input type="text" id="pm-unidad" value="${p?.unidad || 'unid'}" /></div>
    <div class="form-group"><label>Stock mínimo</label><input type="number" id="pm-min" value="${p?.minStock ?? 0}" /></div>
    <div class="form-group"><label>Orden</label><input type="number" id="pm-orden" value="${p?.orden ?? nextOrden}" /></div>
  `;
  const save = document.createElement('button');
  save.className = 'btn btn-primary';
  save.textContent = 'Guardar';
  save.onclick = () => {
    const nombre = $('#pm-nombre').value.trim();
    if (!nombre) { toast('Ingresa un nombre', 'error'); return; }
    const data = {
      id: p?.id || uid(),
      nombre,
      categoria: $('#pm-cat').value,
      unidad: $('#pm-unidad').value || 'unid',
      minStock: +$('#pm-min').value || 0,
      orden: +$('#pm-orden').value || nextOrden,
      activo: p?.activo ?? true
    };
    const ps = DB.get('products', []);
    if (p) ps[ps.findIndex(x => x.id === p.id)] = data;
    else ps.push(data);
    DB.set('products', ps);
    Modal.close();
    renderProductos();
    toast(`Producto ${p ? 'actualizado' : 'creado'}`, 'success');
  };
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-ghost';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => Modal.close();

  Modal.open({ title: p ? 'Editar producto' : 'Nuevo producto', body, footer: [cancel, save] });
}

function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto? No se eliminará de cierres anteriores.')) return;
  const ps = DB.get('products', []).filter(p => p.id !== id);
  DB.set('products', ps);
  renderProductos();
  toast('Producto eliminado', 'success');
}

// ============ USUARIOS ============
function renderUsuarios() {
  if (State.currentUser.rol !== 'admin') {
    navigate('dashboard');
    return;
  }
  const users = DB.get('users', []);
  const branches = DB.get('branches', []);
  const tbody = $('#user-tbody');

  tbody.innerHTML = users.map(u => {
    const branch = branches.find(b => b.id === u.sucursalId);
    const created = new Date(u.createdAt).toLocaleDateString('es-EC');
    return `
      <tr data-id="${u.id}">
        <td><strong>${u.username}</strong></td>
        <td>${u.nombre}</td>
        <td><span class="role-chip ${u.rol}">${u.rol}</span></td>
        <td>${branch?.nombre || '<span class="muted">Todas</span>'}</td>
        <td>
          <label class="toggle">
            <input type="checkbox" ${u.activo ? 'checked' : ''} data-action="toggle"
              ${u.id === State.currentUser.id ? 'disabled' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td class="mono" style="font-size: 0.82rem;">${created}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
            ${u.id !== State.currentUser.id ? `<button class="btn btn-ghost btn-sm" data-action="reset">Restablecer</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    const id = tr.dataset.id;
    const toggle = tr.querySelector('[data-action="toggle"]');
    if (toggle) toggle.onchange = (e) => {
      const us = DB.get('users', []);
      const u = us.find(x => x.id === id);
      u.activo = e.target.checked;
      DB.set('users', us);
      toast(`Usuario ${u.activo ? 'activado' : 'desactivado'}`, 'success');
    };
    tr.querySelector('[data-action="edit"]').onclick = () => openUserModal(id);
    const resetBtn = tr.querySelector('[data-action="reset"]');
    if (resetBtn) resetBtn.onclick = () => resetUserPass(id);
  });
}

function openUserModal(id) {
  const users = DB.get('users', []);
  const u = id ? users.find(x => x.id === id) : null;
  const branches = DB.get('branches', []).filter(b => b.activo);

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="form-group"><label>Usuario (login)</label>
      <input type="text" id="um-user" value="${u?.username || ''}" placeholder="ej. ximena.puyo" ${u ? 'disabled' : ''} />
    </div>
    <div class="form-group"><label>Nombre completo</label>
      <input type="text" id="um-nombre" value="${u?.nombre || ''}" placeholder="Ej. Ximena Rodríguez" />
    </div>
    <div class="form-group"><label>Rol</label>
      <select id="um-rol">
        <option value="empleado" ${u?.rol === 'empleado' ? 'selected' : ''}>Empleado</option>
        <option value="admin" ${u?.rol === 'admin' ? 'selected' : ''}>Administrador</option>
      </select>
    </div>
    <div class="form-group"><label>Sucursal asignada</label>
      <select id="um-suc">
        <option value="">Todas (acceso completo)</option>
        ${branches.map(b => `<option value="${b.id}" ${u?.sucursalId === b.id ? 'selected' : ''}>${b.nombre}</option>`).join('')}
      </select>
    </div>
    ${!u ? `
      <div class="form-group"><label>Contraseña inicial</label>
        <input type="text" id="um-pass" placeholder="Mínimo 6 caracteres" />
      </div>
    ` : ''}
  `;

  const save = document.createElement('button');
  save.className = 'btn btn-primary';
  save.textContent = 'Guardar';
  save.onclick = async () => {
    const username = $('#um-user').value.trim();
    const nombre = $('#um-nombre').value.trim();
    const rol = $('#um-rol').value;
    const sucursalId = $('#um-suc').value || null;
    if (!nombre) { toast('Ingresa el nombre', 'error'); return; }

    const us = DB.get('users', []);
    if (!u) {
      if (!username) { toast('Ingresa el usuario', 'error'); return; }
      if (us.some(x => x.username.toLowerCase() === username.toLowerCase())) {
        toast('Usuario ya existe', 'error'); return;
      }
      const pass = $('#um-pass').value;
      if (!pass || pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
      const passHash = await hashPass(pass);
      us.push({
        id: uid(), username, nombre, rol, sucursalId, passHash,
        activo: true, createdAt: new Date().toISOString()
      });
    } else {
      const user = us.find(x => x.id === u.id);
      user.nombre = nombre;
      user.rol = rol;
      user.sucursalId = sucursalId;
    }
    DB.set('users', us);
    Modal.close();
    renderUsuarios();
    toast(`Usuario ${u ? 'actualizado' : 'creado'}`, 'success');
  };
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-ghost';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => Modal.close();

  Modal.open({ title: u ? 'Editar usuario' : 'Nuevo usuario', body, footer: [cancel, save] });
}

function resetUserPass(id) {
  const users = DB.get('users', []);
  const u = users.find(x => x.id === id);

  const body = document.createElement('div');
  body.innerHTML = `
    <p>Restablecer contraseña para <strong>${u.nombre}</strong> (${u.username}).</p>
    <div class="form-group"><label>Nueva contraseña</label>
      <input type="text" id="rp-pass" placeholder="Mínimo 6 caracteres" />
    </div>
  `;
  const save = document.createElement('button');
  save.className = 'btn btn-primary';
  save.textContent = 'Restablecer';
  save.onclick = async () => {
    const pass = $('#rp-pass').value;
    if (!pass || pass.length < 6) { toast('Mínimo 6 caracteres', 'error'); return; }
    u.passHash = await hashPass(pass);
    DB.set('users', users);
    Modal.close();
    toast('Contraseña actualizada', 'success');
  };
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-ghost';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => Modal.close();

  Modal.open({ title: 'Restablecer contraseña', body, footer: [cancel, save] });
  setTimeout(() => $('#rp-pass').focus(), 100);
}

// ============ SUCURSALES ============
function renderSucursales() {
  if (State.currentUser.rol !== 'admin') {
    navigate('dashboard');
    return;
  }
  const branches = DB.get('branches', []);
  const cierres = DB.get('cierres', []);
  const users = DB.get('users', []);

  $('#branches-grid').innerHTML = branches.map(b => {
    const bCierres = cierres.filter(c => c.sucursalId === b.id);
    const lastCierre = bCierres.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const bUsers = users.filter(u => u.sucursalId === b.id && u.activo);
    return `
      <div class="branch-card" data-id="${b.id}">
        <div class="branch-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
        </div>
        <div class="branch-name">${b.nombre}</div>
        <div class="branch-location">${b.ubicacion}</div>
        <div class="branch-stats">
          <div>
            <div class="branch-stat-label">Cierres</div>
            <div class="branch-stat-value">${bCierres.length}</div>
          </div>
          <div>
            <div class="branch-stat-label">Usuarios</div>
            <div class="branch-stat-value">${bUsers.length}</div>
          </div>
          <div>
            <div class="branch-stat-label">Último cierre</div>
            <div class="branch-stat-value" style="font-size:0.85rem;">${lastCierre ? fmtDate(lastCierre.fecha) : '—'}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  $$('#branches-grid .branch-card').forEach(card => {
    card.querySelector('[data-action="edit"]').onclick = (e) => {
      e.stopPropagation();
      openBranchModal(card.dataset.id);
    };
  });
}

function openBranchModal(id) {
  const branches = DB.get('branches', []);
  const b = id ? branches.find(x => x.id === id) : null;

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="form-group"><label>Nombre de la sucursal</label>
      <input type="text" id="bm-nombre" value="${b?.nombre || ''}" placeholder="ej. Puyo Centro" />
    </div>
    <div class="form-group"><label>Ubicación</label>
      <input type="text" id="bm-ubi" value="${b?.ubicacion || ''}" placeholder="ej. Puyo, Pastaza" />
    </div>
    ${b ? `
      <div class="form-group" style="flex-direction:row; align-items:center; gap:0.75rem;">
        <label class="toggle">
          <input type="checkbox" id="bm-act" ${b.activo ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
        <span>Sucursal activa</span>
      </div>
    ` : ''}
  `;
  const save = document.createElement('button');
  save.className = 'btn btn-primary';
  save.textContent = 'Guardar';
  save.onclick = () => {
    const nombre = $('#bm-nombre').value.trim();
    const ubicacion = $('#bm-ubi').value.trim();
    if (!nombre) { toast('Ingresa un nombre', 'error'); return; }
    const bs = DB.get('branches', []);
    if (b) {
      const target = bs.find(x => x.id === b.id);
      target.nombre = nombre;
      target.ubicacion = ubicacion;
      target.activo = $('#bm-act').checked;
    } else {
      bs.push({ id: uid(), nombre, ubicacion, activo: true });
    }
    DB.set('branches', bs);
    Modal.close();
    setupUI();
    renderSucursales();
    toast(`Sucursal ${b ? 'actualizada' : 'creada'}`, 'success');
  };
  const cancel = document.createElement('button');
  cancel.className = 'btn btn-ghost';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => Modal.close();

  Modal.open({ title: b ? 'Editar sucursal' : 'Nueva sucursal', body, footer: [cancel, save] });
}

// ============ BOOT ============
init();
