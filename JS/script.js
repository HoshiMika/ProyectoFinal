/* script.js adaptado a diseño Bootstrap (DummyJSON login sin correo) */
const API_PRODUCTS = 'https://fakestoreapi.com/products';
const API_LOGIN = 'https://dummyjson.com/auth/login';

const catalogo = document.getElementById('catalogo-productos');
const carritoCont = document.getElementById('carrito');
const carritoCount = document.getElementById('carrito-count');
const userStatus = document.getElementById('user-status');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalEl = document.getElementById('modal-login');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const vaciarBtn = document.getElementById('vaciar-carrito');
const checkoutBtn = document.getElementById('checkout');
const searchInput = document.getElementById('search');

let bsModal = null;

const carrito = {
  items: [],

  agregarItem(product){
    const existente = this.items.find(i => i.id === product.id);
    if(existente) existente.qty++;
    else this.items.push({
      id: product.id,
      title: product.title,
      price: product.price,
      qty: 1,
      img: product.image,
      customDescription: product.customDescription || ''
    });
    this.save();
    this.renderizarCarrito();
  },

  quitarItem(id){
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.renderizarCarrito();
  },

  vaciar(){
    this.items = [];
    this.save();
    this.renderizarCarrito();
  },

  calcularTotal(){
    return this.items.reduce((s,i)=> s + i.price * i.qty, 0);
  },

  renderizarCarrito(){
    carritoCount.textContent = this.items.reduce((s,i)=> s + i.qty, 0);
    if(this.items.length === 0){
      carritoCont.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
      return;
    }

    const ul = document.createElement('div');
    ul.className = 'list-group';
    this.items.forEach(it => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex align-items-start gap-3';
      item.innerHTML = `
        <img src="${it.img}" alt="${escapeHtml(it.title)}" width="64" height="64" class="rounded product-img">
        <div class="flex-grow-1">
          <div class="product-title">${escapeHtml(it.title)}</div>
          <div class="product-desc">${escapeHtml(it.customDescription)}</div>
        </div>
        <div class="text-end">
          <div class="fw-bold">$${(it.price * it.qty).toFixed(2)}</div>
          <div class="small text-muted">${it.qty} x $${it.price.toFixed(2)}</div>
          <button class="btn btn-sm btn-link text-danger remove-item" data-id="${it.id}">Quitar</button>
        </div>
      `;
      ul.appendChild(item);
    });

    const footer = document.createElement('div');
    footer.className = 'mt-2 text-end';
    footer.innerHTML = `<strong>Total: $${this.calcularTotal().toFixed(2)}</strong>`;

    carritoCont.innerHTML = '';
    carritoCont.appendChild(ul);
    carritoCont.appendChild(footer);

    carritoCont.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        const id = parseInt(e.target.dataset.id, 10);
        this.quitarItem(id);
      });
    });
  },

  save(){
    try {
      localStorage.setItem('miCarrito', JSON.stringify(this.items));
    } catch(e){
      console.warn('No se pudo guardar el carrito en localStorage', e);
    }
  },

  load(){
    try {
      const raw = localStorage.getItem('miCarrito');
      if(raw) this.items = JSON.parse(raw) || [];
    } catch(e){
      console.warn('Error leyendo carrito de localStorage', e);
      this.items = [];
    }
  }
};

function escapeHtml(text){
  if (text == null) return '';
  return String(text)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,"&#039;");
}

async function cargarProductos(){
  try{
    catalogo.innerHTML = '<div class="col-12"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    const r = await fetch(API_PRODUCTS);
    if(!r.ok) throw new Error('Error al cargar productos: ' + r.status);
    const productos = await r.json();
    catalogo.innerHTML = '';
    productos.forEach(p=>{
      p.customDescription = `Perfecto para quienes buscan ${p.category}. Calidad y estilo en un solo producto.`;
      renderCard(p);
    });
  }catch(e){
    console.error(e);
    catalogo.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error al cargar productos.</div></div>';
  }
}

function renderCard(product){
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="card-body d-flex flex-column">
        <div class="mb-2 d-flex align-items-center justify-content-center" style="height:160px">
          <img src="${product.image}" alt="${escapeHtml(product.title)}" style="max-width:100%;max-height:140px;object-fit:contain;">
        </div>
        <h6 class="card-title">${escapeHtml(product.title)}</h6>
        <p class="card-text product-desc">${escapeHtml(product.customDescription)}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div class="fw-bold">$${product.price.toFixed(2)}</div>
          <button class="btn btn-sm btn-primary" data-id="${product.id}">Añadir</button>
        </div>
      </div>
    </div>
  `;
  catalogo.appendChild(col);
  col.querySelector('button').addEventListener('click', ()=> carrito.agregarItem(product));
}

function initModal(){
  if(typeof bootstrap !== 'undefined' && modalEl){
    bsModal = new bootstrap.Modal(modalEl);
  } else {
    console.warn('Bootstrap modal no disponible.');
  }
}

btnLogin.addEventListener('click', ()=> {
  if(bsModal) bsModal.show();
});

loginForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  loginError.textContent = '';

  // obtiene username y password
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try{
    const resp = await fetch(API_LOGIN, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username,
        password,
        expiresInMins: 30
      }),
    });

    const data = await resp.json();
    if(resp.ok && data.accessToken){
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('userName', username);
      updateUserUI();
      if(bsModal) bsModal.hide();
      loginForm.reset();
    } else {
      loginError.textContent = data.message || 'Credenciales inválidas';
    }
  }catch(err){
    console.error(err);
    loginError.textContent = 'Error de red, intente luego';
  }
});

btnLogout.addEventListener('click', ()=>{
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  updateUserUI();
});

function updateUserUI(){
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('userName');
  if(token){
    userStatus.textContent = username || 'Usuario';
    btnLogin.classList.add('d-none');
    btnLogout.classList.remove('d-none');
  } else {
    userStatus.textContent = 'Invitado';
    btnLogin.classList.remove('d-none');
    btnLogout.classList.add('d-none');
  }
}

vaciarBtn.addEventListener('click', ()=> carrito.vaciar());

checkoutBtn.addEventListener('click', ()=>{
  if(carrito.items.length === 0){ alert('El carrito está vacío'); return; }
  if(!localStorage.getItem('token')){ alert('Debes iniciar sesión para finalizar la compra'); return; }
  alert('Compra simulada realizada. ¡Gracias!');
  carrito.vaciar();
});

searchInput.addEventListener('input', ()=>{
  const q = searchInput.value.trim().toLowerCase();
  Array.from(catalogo.children).forEach(col=>{
    const titleEl = col.querySelector('.card-title');
    const title = titleEl ? titleEl.textContent.toLowerCase() : '';
    col.style.display = title.includes(q) ? '' : 'none';
  });
});

carrito.load();
carrito.renderizarCarrito();
initModal();
updateUserUI();
cargarProductos();
