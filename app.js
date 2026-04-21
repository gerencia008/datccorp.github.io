/* ============================================================
   DATC CORP S.A.S. · SISTEMA DE INVENTARIO
   Lógica principal - v2.0
   ============================================================ */

// ============ UTILIDADES ============
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => Math.random().toString(36).substring(2, 11);
const fmt = (n) => Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => n === null || n === undefined ? '—' : Number(n).toLocaleString('es-EC');
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[+m - 1]} ${y}`;
};
const fmtDateLong = (d) => {
  if (!d) return '—';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Hash SHA-256 con salt
const hashPass = async (str) => {
  const buf = new TextEncoder().encode(str + 'datc-corp-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============ STORAGE ============
const DB = {
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem('datc:' + key)) ?? def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem('datc:' + key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem('datc:' + key); }
};

// ============ TOAST ============
function toast(msg, type = 'info') {
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
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
    dlg.style.maxWidth = size === 'lg' ? '800px' : '500px';
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
const DEFAULT_PRODUCTS = [
  { id: 'p01', nombre: 'Alas',           categoria: 'Alimentos',  unidad: 'unid', minStock: 500, orden: 1,  activo: true },
  { id: 'p02', nombre: 'Salchichas',     categoria: 'Alimentos',  unidad: 'unid', minStock: 30,  orden: 2,  activo: true },
  { id: 'p03', nombre: 'Hamburguesa',    categoria: 'Alimentos',  unidad: 'unid', minStock: 50,  orden: 3,  activo: true },
  { id: 'p04', nombre: 'Pan',            categoria: 'Alimentos',  unidad: 'unid', minStock: 50,  orden: 4,  activo: true },
  { id: 'p05', nombre: 'Chili',          categoria: 'Alimentos',  unidad: 'unid', minStock: 30,  orden: 5,  activo: true },
  { id: 'p06', nombre: 'Lomo',           categoria: 'Alimentos',  unidad: 'unid', minStock: 25,  orden: 6,  activo: true },
  { id: 'p07', nombre: 'Fuze Tea',       categoria: 'Bebidas',    unidad: 'unid', minStock: 25,  orden: 7,  activo: true },
  { id: 'p08', nombre: 'Cola 3 Litros',  categoria: 'Bebidas',    unidad: 'unid', minStock: 20,  orden: 8,  activo: true },
  { id: 'p09', nombre: 'Cola Vidrio',    categoria: 'Bebidas',    unidad: 'unid', minStock: 50,  orden: 9,  activo: true },
  { id: 'p10', nombre: 'Coca Cola 1.35L',categoria: 'Bebidas',    unidad: 'unid', minStock: 200, orden: 10, activo: true },
  { id: 'p11', nombre: 'Agua 500 ml',    categoria: 'Bebidas',    unidad: 'unid', minStock: 40,  orden: 11, activo: true },
  { id: 'p12', nombre: 'T. Bebida Vidrio',   categoria: 'Bebidas', unidad: 'unid', minStock: 150, orden: 12, activo: true },
  { id: 'p13', nombre: 'T. Bebida Plástico', categoria: 'Bebidas', unidad: 'unid', minStock: 150, orden: 13, activo: true },
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
  { id: 'b01', nombre: 'Puyo',           ubicacion: 'Puyo, Pastaza',        activo: true },
  { id: 'b02', nombre: 'Tena',           ubicacion: 'Tena, Napo',           activo: true },
  { id: 'b03', nombre: 'Riobamba Norte', ubicacion: 'Riobamba, Chimborazo', activo: true },
  { id: 'b04', nombre: 'Riobamba Sur',   ubicacion: 'Riobamba, Chimborazo', activo: true },
  { id: 'b05', nombre: 'Riobamba Centro',ubicacion: 'Riobamba, Chimborazo', activo: true }
];

// ============ ESTADO GLOBAL ============
const State = {
  currentUser: null,
  currentBranch: null,
  currentView: 'dashboard',
  cierreData: null,
  filteredCierres: [], // Guarda los cierres filtrados para export
};

// ============ INIT ============
async function init() {
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
  if (!DB.get('nextCierreNum')) DB.set('nextCierreNum', 1230);

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
  setupRevealObserver();
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

// ============ SCROLL REVEAL (Apple style) ============
function setupRevealObserver() {
  if (window.__revealObserver) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  window.__revealObserver = observer;
  refreshRevealObserver();
}
function refreshRevealObserver() {
  if (!window.__revealObserver) return;
  $$('.reveal:not(.visible)').forEach(el => window.__revealObserver.observe(el));
}

// ============ SETUP UI ============
function setupUI() {
  const u = State.currentUser;
  $('#user-name').textContent = u.nombre;
  $('#user-role').textContent = u.rol;
  $('#user-avatar').textContent = u.nombre.charAt(0).toUpperCase();

  const isAdmin = u.rol === 'admin';
  $$('.admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin));

  // Sucursales
  const branches = DB.get('branches', []).filter(b => b.activo);
  const selector = $('#branch-selector');
  selector.innerHTML = branches.map(b =>
    `<option value="${b.id}">${b.nombre}</option>`
  ).join('');

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

  // Fecha actual
  const todayStr = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('#dash-today').textContent = 'Hoy es ' + todayStr;

  // Navegación
  $$('.nav-link').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.view);
  });
  $$('[data-navigate]').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.navigate);
  });

  // User dropdown
  const userBtn = $('#nav-user-btn');
  $('#user-avatar').onclick = (e) => {
    e.stopPropagation();
    userBtn.classList.toggle('open');
  };
  document.addEventListener('click', (e) => {
    if (!userBtn.contains(e.target)) userBtn.classList.remove('open');
  });

  // Mobile menu
  $('#mobile-toggle').onclick = () => $('#nav-menu').classList.toggle('open');

  // Cierre buttons
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

  // Export buttons
  $('#btn-export-pdf').onclick = exportToPDF;
  $('#btn-export-excel').onclick = exportToExcel;

  // Admin buttons
  if (isAdmin) {
    $('#btn-add-user').onclick = () => openUserModal();
    $('#btn-add-branch').onclick = () => openBranchModal();
    $('#btn-add-producto').onclick = () => openProductModal();
  }
}

function navigate(view) {
  State.currentView = view;
  $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $('#nav-menu').classList.remove('open');

  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(refreshRevealObserver, 100);
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

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCierres = cierres.filter(c => new Date(c.fecha) >= weekAgo);
  const totalWeek = weekCierres.reduce((s, c) => s + (+c.totalVentas || 0), 0);
  const lastCierre = cierres.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  let totalDescuadres = 0;
  weekCierres.forEach(c => {
    (c.items || []).forEach(it => {
      if (it.cuadre !== 0 && it.cuadre !== null) totalDescuadres++;
    });
  });

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

  // Stats con iconos grandes
  $('#stats-grid').innerHTML = `
    <div class="stat-card reveal">
      <div class="stat-icon orange">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 26 L10 18 L16 22 L22 12 L28 18"/>
          <circle cx="10" cy="18" r="1.5" fill="currentColor"/>
          <circle cx="16" cy="22" r="1.5" fill="currentColor"/>
          <circle cx="22" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="28" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <div class="stat-label">Ventas última semana</div>
      <div class="stat-value">$${fmt(totalWeek)}</div>
      <div class="stat-meta">${weekCierres.length} cierres · ${branchName}</div>
    </div>
    <div class="stat-card reveal">
      <div class="stat-icon red">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="4" width="22" height="25" rx="2"/>
          <line x1="10" y1="12" x2="22" y2="12"/>
          <line x1="10" y1="18" x2="22" y2="18"/>
          <line x1="10" y1="24" x2="18" y2="24"/>
        </svg>
      </div>
      <div class="stat-label">Último cierre</div>
      <div class="stat-value">${lastCierre ? '$' + fmt(lastCierre.totalVentas) : '—'}</div>
      <div class="stat-meta">${lastCierre ? fmtDate(lastCierre.fecha) + ' · ' + (lastCierre.responsable || '—') : 'Sin registros'}</div>
    </div>
    <div class="stat-card reveal">
      <div class="stat-icon ${totalDescuadres === 0 ? 'purple' : 'red'}">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="16" cy="16" r="12"/>
          ${totalDescuadres === 0
            ? '<path d="M10 16 L14 20 L22 12"/>'
            : '<line x1="11" y1="11" x2="21" y2="21"/><line x1="21" y1="11" x2="11" y2="21"/>'}
        </svg>
      </div>
      <div class="stat-label">Descuadres (7 días)</div>
      <div class="stat-value">${totalDescuadres}</div>
      <div class="stat-meta">${totalDescuadres === 0 ? 'Todo cuadrado ✓' : 'Requiere revisión'}</div>
    </div>
    <div class="stat-card reveal">
      <div class="stat-icon brown">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 11 L16 5 L27 11 L27 22 L16 28 L5 22 Z"/>
          <path d="M5 11 L16 17 L27 11"/>
          <line x1="16" y1="17" x2="16" y2="28"/>
        </svg>
      </div>
      <div class="stat-label">Bajo stock mínimo</div>
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
  const lowCountEl = $('#low-stock-count');
  lowCountEl.textContent = lowStock.length;
  lowCountEl.className = 'badge-lg' + (lowStock.length === 0 ? ' zero' : '');

  $('#dash-lowstock').innerHTML = lowStock.length ?
    lowStock.slice(0, 6).map(l => `
      <div class="recent-item">
        <div><strong>${l.nombre}</strong></div>
        <div class="recent-date"><span class="mono">${fmtInt(l.existencias)}</span> / min ${fmtInt(l.min)}</div>
      </div>
    `).join('') :
    '<div class="empty-state">Todos los productos sobre el mínimo ✓</div>';

  refreshRevealObserver();
}

// ============ CIERRE DIARIO ============
function renderCierre() {
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

  let lastCat = null;
  products.forEach((p) => {
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
  if (c === null) return '<span style="color: var(--ink-light)">—</span>';
  if (c === 0) return '<span class="check">✓</span>';
  return `<span class="error">${c > 0 ? '+' : ''}${c}</span>`;
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
  State.cierreData.gastos.forEach((g, idx) => list.appendChild(buildGastoRow(g, idx)));
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
  remBtn.onclick = () => { State.cierreData.gastos.splice(idx, 1); renderGastos(); };
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
  State.cierreData.mermasDetalle.forEach((m, idx) => list.appendChild(buildMermaRow(m, idx)));
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
  remBtn.onclick = () => { State.cierreData.mermasDetalle.splice(idx, 1); renderMermas(); };
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

  const from = $('#filter-from').value;
  const to = $('#filter-to').value;
  const resp = $('#filter-resp').value.toLowerCase();

  let filtered = cierres;
  if (State.currentUser.rol !== 'admin' && State.currentUser.sucursalId) {
    filtered = filtered.filter(c => c.sucursalId === State.currentUser.sucursalId);
  }
  if (from) filtered = filtered.filter(c => c.fecha >= from);
  if (to) filtered = filtered.filter(c => c.fecha <= to);
  if (resp) filtered = filtered.filter(c => (c.responsable || '').toLowerCase().includes(resp));

  filtered.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero - a.numero);

  State.filteredCierres = filtered;

  const tbody = $('#hist-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 3rem; text-align: center;" class="empty-state">Sin resultados</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    const descuadres = (c.items || []).filter(i => i.cuadre !== 0 && i.cuadre !== null).length;
    const estado = descuadres === 0 ? 'success' : 'warning';
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
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--line-soft);">
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em; font-weight:600;">N° Cierre</div><div style="font-family: var(--font-display); font-size: 1.3rem; margin-top: 4px;">#${String(c.numero).padStart(7, '0')}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em; font-weight:600;">Fecha</div><div style="font-family: var(--font-display); font-size: 1.3rem; margin-top: 4px;">${fmtDate(c.fecha)}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em; font-weight:600;">Sucursal</div><div style="font-family: var(--font-display); font-size: 1.3rem; margin-top: 4px;">${branch?.nombre || '—'}</div></div>
      <div><div class="muted" style="text-transform:uppercase; font-size:0.7rem; letter-spacing:0.08em; font-weight:600;">Total ventas</div><div style="font-family: var(--font-display); font-size: 1.3rem; margin-top: 4px; color: var(--honey-mustard);">$${fmt(c.totalVentas)}</div></div>
    </div>
    <div style="margin: 1rem 0;"><strong>Responsable:</strong> ${c.responsable || '—'}</div>
    <div style="max-height: 400px; overflow: auto; border: 1px solid var(--line); border-radius: 8px;">
      <table class="inv-table" style="font-size: 0.82rem;">
        <thead><tr><th>Producto</th><th>Inv.I</th><th>Ing</th><th>T1</th><th>Vtas</th><th>Merma</th><th>Exist</th><th>T2</th><th>Cuadre</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${c.gastos?.length ? `
      <div style="margin-top: 1rem;">
        <strong>Gastos registrados:</strong>
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

// ============ EXPORTACIÓN PDF ============
function exportToPDF() {
  const cierres = State.filteredCierres || [];
  if (cierres.length === 0) {
    toast('No hay cierres para exportar con los filtros actuales', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const branches = DB.get('branches', []);

  // Obtener filtros aplicados
  const from = $('#filter-from').value;
  const to = $('#filter-to').value;
  const resp = $('#filter-resp').value;
  const totalVentas = cierres.reduce((s, c) => s + (+c.totalVentas || 0), 0);

  // HEADER de marca
  doc.setFillColor(238, 131, 18); // Honey mustard
  doc.rect(0, 0, 297, 28, 'F');

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DATC CORP S.A.S.', 15, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Cierres Diarios de Inventario', 15, 22);

  // Info del reporte (a la derecha)
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 282, 15, { align: 'right' });
  doc.text(`Por: ${State.currentUser.nombre}`, 282, 20, { align: 'right' });
  doc.text(`Total de registros: ${cierres.length}`, 282, 25, { align: 'right' });

  // FILTROS aplicados
  let y = 36;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Filtros aplicados:', 15, y);
  doc.setFont('helvetica', 'normal');
  y += 5;

  const filtros = [];
  if (from) filtros.push(`Desde: ${fmtDate(from)}`);
  if (to) filtros.push(`Hasta: ${fmtDate(to)}`);
  if (resp) filtros.push(`Responsable: ${resp}`);
  if (filtros.length === 0) filtros.push('Sin filtros (todos los cierres)');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(filtros.join('   ·   '), 15, y);
  y += 8;

  // KPIs resumidos
  doc.setFillColor(103, 28, 11); // BBQ Clásico
  doc.rect(15, y, 267, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VENTAS:', 20, y + 6);
  doc.setFontSize(13);
  doc.text(`$ ${fmt(totalVentas)}`, 20, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('N° CIERRES:', 100, y + 6);
  doc.setFontSize(13);
  doc.text(`${cierres.length}`, 100, y + 11);

  let totalDescuadres = 0;
  cierres.forEach(c => {
    (c.items || []).forEach(i => {
      if (i.cuadre !== 0 && i.cuadre !== null) totalDescuadres++;
    });
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCUADRES TOTALES:', 165, y + 6);
  doc.setFontSize(13);
  doc.text(`${totalDescuadres}`, 165, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROMEDIO POR CIERRE:', 230, y + 6);
  doc.setFontSize(13);
  doc.text(`$ ${fmt(totalVentas / cierres.length)}`, 230, y + 11);

  y += 20;

  // TABLA principal
  const tableData = cierres.map(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    const descuadres = (c.items || []).filter(i => i.cuadre !== 0 && i.cuadre !== null).length;
    const totalGastos = (c.gastos || []).reduce((s, g) => s + (+g.monto || 0), 0);
    return [
      '#' + String(c.numero).padStart(7, '0'),
      fmtDate(c.fecha),
      branch?.nombre || '—',
      c.responsable || '—',
      '$ ' + fmt(c.totalVentas),
      '$ ' + fmt(totalGastos),
      String(descuadres),
      descuadres === 0 ? '✓ Cuadrado' : `${descuadres} desc.`
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['N°', 'Fecha', 'Sucursal', 'Responsable', 'Total Ventas', 'Gastos', 'Descuadres', 'Estado']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [29, 29, 31],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 30, 30]
    },
    alternateRowStyles: {
      fillColor: [251, 251, 253]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { cellWidth: 30 },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center' }
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data) => {
      // Colorear el estado
      if (data.column.index === 7 && data.section === 'body') {
        if (data.cell.raw.startsWith('✓')) {
          data.cell.styles.textColor = [45, 138, 63];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [229, 32, 42];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // FOOTER en cada página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(
      `DATC CORP S.A.S. · Sistema de Control de Inventario · Página ${i} de ${pageCount}`,
      148.5, 205,
      { align: 'center' }
    );
  }

  // Guardar
  const filename = `DATC_Reporte_Cierres_${today()}.pdf`;
  doc.save(filename);
  toast(`PDF generado: ${filename}`, 'success');
}

// ============ EXPORTACIÓN EXCEL ============
function exportToExcel() {
  const cierres = State.filteredCierres || [];
  if (cierres.length === 0) {
    toast('No hay cierres para exportar con los filtros actuales', 'warning');
    return;
  }

  const branches = DB.get('branches', []);
  const products = DB.get('products', []);

  // === HOJA 1: Resumen de cierres ===
  const summaryData = [
    ['DATC CORP S.A.S. - REPORTE DE CIERRES DIARIOS'],
    [`Generado: ${new Date().toLocaleString('es-EC')}  ·  Por: ${State.currentUser.nombre}`],
    [],
    ['N° Cierre', 'Fecha', 'Sucursal', 'Responsable', 'Total Ventas', 'Total Gastos', 'Productos', 'Descuadres', 'Estado']
  ];

  cierres.forEach(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    const descuadres = (c.items || []).filter(i => i.cuadre !== 0 && i.cuadre !== null).length;
    const productosRegistrados = (c.items || []).filter(i => computeCuadre(i) !== null).length;
    const totalGastos = (c.gastos || []).reduce((s, g) => s + (+g.monto || 0), 0);

    summaryData.push([
      '#' + String(c.numero).padStart(7, '0'),
      c.fecha,
      branch?.nombre || '—',
      c.responsable || '—',
      +c.totalVentas || 0,
      totalGastos,
      productosRegistrados,
      descuadres,
      descuadres === 0 ? 'Cuadrado' : `${descuadres} descuadre(s)`
    ]);
  });

  // Totales
  const totalVentas = cierres.reduce((s, c) => s + (+c.totalVentas || 0), 0);
  const totalGastosAll = cierres.reduce((s, c) => s + (c.gastos || []).reduce((s2, g) => s2 + (+g.monto || 0), 0), 0);
  summaryData.push([]);
  summaryData.push(['', '', '', 'TOTALES:', totalVentas, totalGastosAll, '', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 25 },
    { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }
  ];
  // Merge del título
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
  ];

  // === HOJA 2: Detalle por producto de cada cierre ===
  const detailData = [
    ['DETALLE POR PRODUCTO'],
    [`${cierres.length} cierre(s) exportado(s)`],
    [],
    ['N° Cierre', 'Fecha', 'Sucursal', 'Responsable', 'Producto', 'Categoría',
     'Inv. Inicial', 'Ingresos', 'Total 1', 'Ventas', 'Mermas', 'Existencias', 'Total 2', 'Cuadre']
  ];

  cierres.forEach(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    (c.items || []).forEach(it => {
      if (computeCuadre(it) === null) return; // Solo productos con datos
      const prod = products.find(p => p.id === it.productId);
      const t1 = computeTotal1(it);
      const t2 = computeTotal2(it);
      const cuadre = computeCuadre(it);

      detailData.push([
        '#' + String(c.numero).padStart(7, '0'),
        c.fecha,
        branch?.nombre || '—',
        c.responsable || '—',
        prod?.nombre || '—',
        prod?.categoria || '—',
        it.invInicial ?? '',
        it.ingresos ?? '',
        t1 ?? '',
        it.ventas ?? '',
        it.mermas ?? '',
        it.existencias ?? '',
        t2 ?? '',
        cuadre
      ]);
    });
  });

  const ws2 = XLSX.utils.aoa_to_sheet(detailData);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 14 },
    { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
  ];
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }
  ];

  // === HOJA 3: Gastos ===
  const gastosData = [
    ['REGISTRO DE GASTOS'],
    [],
    ['N° Cierre', 'Fecha', 'Sucursal', 'Responsable', 'Concepto', 'Monto ($)']
  ];
  let totalGastosDetalle = 0;
  cierres.forEach(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    (c.gastos || []).forEach(g => {
      gastosData.push([
        '#' + String(c.numero).padStart(7, '0'),
        c.fecha,
        branch?.nombre || '—',
        c.responsable || '—',
        g.descripcion || '',
        +g.monto || 0
      ]);
      totalGastosDetalle += +g.monto || 0;
    });
  });
  if (gastosData.length > 3) {
    gastosData.push([]);
    gastosData.push(['', '', '', '', 'TOTAL:', totalGastosDetalle]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(gastosData);
  ws3['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 35 }, { wch: 14 }];
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  // === HOJA 4: Mermas ===
  const mermasData = [
    ['REGISTRO DE MERMAS'],
    [],
    ['N° Cierre', 'Fecha', 'Sucursal', 'Responsable', 'Descripción', 'Cantidad']
  ];
  cierres.forEach(c => {
    const branch = branches.find(b => b.id === c.sucursalId);
    (c.mermasDetalle || []).forEach(m => {
      mermasData.push([
        '#' + String(c.numero).padStart(7, '0'),
        c.fecha,
        branch?.nombre || '—',
        c.responsable || '—',
        m.descripcion || '',
        +m.cantidad || 0
      ]);
    });
  });
  const ws4 = XLSX.utils.aoa_to_sheet(mermasData);
  ws4['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 35 }, { wch: 12 }];
  ws4['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  // Crear libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle por Producto');
  XLSX.utils.book_append_sheet(wb, ws3, 'Gastos');
  XLSX.utils.book_append_sheet(wb, ws4, 'Mermas');

  const filename = `DATC_Reporte_Cierres_${today()}.xlsx`;
  XLSX.writeFile(wb, filename);
  toast(`Excel generado: ${filename}`, 'success');
}

// ============ PRODUCTOS ============
function renderProductos() {
  const products = DB.get('products', []).sort((a, b) => a.orden - b.orden);
  const tbody = $('#prod-tbody');
  const isAdmin = State.currentUser.rol === 'admin';

  tbody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
      <td class="mono">${String(p.orden).padStart(2, '0')}</td>
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
            <button class="btn btn-ghost btn-sm" data-action="delete" style="color: var(--paprica);">Eliminar</button>
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
      <div class="branch-card reveal" data-id="${b.id}">
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
            <div class="branch-stat-label">Último</div>
            <div class="branch-stat-value" style="font-size:0.95rem;">${lastCierre ? fmtDate(lastCierre.fecha) : '—'}</div>
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

  refreshRevealObserver();
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
