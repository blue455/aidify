/* ================= State & Persistence (real data sources) ================= */
const STORAGE_KEY = 'shopmate:user:v4';

function readLS(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } }
function writeLS(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

let state = loadState();

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = raw ? JSON.parse(raw) : {
      profile: { name:'Guest User', email:'guest@example.com', phone:'', address:'', avatar:'assets/default-avatar.png' },
      preferences: { darkMode:false, language:'EN', currency:'USD', accessibility:{ fontScale:100, contrast:'normal', reducedMotion:false } },
      notifications: { orders:true, promos:false, wishlist:true },
      wallet: { balance: 0 },
      rewards: { points: 0, tier: 'Bronze' },
      payments: { cards: [] },
      orders: [], wishlist: [], cart: [], reviews: []
    };
    // hydrate dynamic parts from aidify storage
    base.orders = readLS('aidify.orders', []);
    base.wishlist = readLS('aidify.wishlist', []).map(id=>({ id }));
    base.cart = readLS('aidify.cart', []);
    base.reviews = base.reviews || [];
    return base;
  } catch {
    return {
      profile: { name:'Guest User', email:'guest@example.com', phone:'', address:'', avatar:'assets/default-avatar.png' },
      preferences: { darkMode:false, language:'EN', currency:'USD', accessibility:{ fontScale:100, contrast:'normal', reducedMotion:false } },
      notifications: { orders:true, promos:false, wishlist:true },
      wallet: { balance: 0 },
      rewards: { points: 0, tier: 'Bronze' },
      payments: { cards: [] }, orders: readLS('aidify.orders', []), wishlist: readLS('aidify.wishlist', []).map(id=>({id})), cart: readLS('aidify.cart', []), reviews: []
    };
  }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ================= Utilities ================= */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
function money(n, ccy){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy}).format(Number(n||0)); }catch{ return `${ccy} ${Number(n||0).toFixed(2)}`; } }
function maskCard(num){ const d=(num||'').replace(/\s+/g,''); if(d.length<4) return '•••��� •���•• •••• ••••'; return `•••• •••• •••• ${d.slice(-4)}`; }

/* ================= Theme & Accessibility ================= */
function applyThemeAndA11y(){
  const root = document.documentElement;
  root.classList.toggle('dark', !!state.preferences.darkMode);
  // Drop accessibility UI controls; keep minimal theming only
  const scale = 100; // fixed base
  root.style.setProperty('--fs-base', `${Math.round(14 * (scale/100))}px`);
}

/* ================= Rendering ================= */
function renderTopbar(){
  $('#miniAvatar').src = state.profile.avatar;
  $('#miniName').textContent  = state.profile.name || '—';
  $('#miniEmail').textContent = state.profile.email || '—';
  $('#pillCurrency').textContent = state.preferences.currency;
  $('#pillLanguage').textContent = state.preferences.language;
  // cart & wishlist badges from aidify
  const cart = readLS('aidify.cart', []);
  const cartQty = cart.reduce((s,i)=> s + (Number(i.qty)||0), 0);
  const wish = readLS('aidify.wishlist', []);
  $('#pillCart').textContent = `Cart: ${cartQty}`;
  $('#pillWishlist').textContent = `Wishlist: ${wish.length}`;
}

function renderOverview(){
  $('#heroAvatar').src = state.profile.avatar;
  $('#heroName').textContent = state.profile.name || '—';
  $('#heroEmail').textContent = state.profile.email || '—';
  $('#heroPhone').textContent = state.profile.phone || '—';
  $('#heroAddress').textContent = state.profile.address || '—';

  // Rewards: compute 1 point per $1 spent
  const totalSpent = (readLS('aidify.orders', [])||[]).reduce((s,o)=> s + Number(o.total||0), 0);
  state.rewards.points = Math.round(totalSpent);
  state.rewards.tier = state.rewards.points > 2000 ? 'Platinum' : state.rewards.points > 1000 ? 'Gold' : state.rewards.points > 500 ? 'Silver' : 'Bronze';

  $('#statBalance').textContent = money(state.wallet.balance||0, state.preferences.currency);
  $('#statPoints').textContent  = state.rewards.points ?? 0;
  $('#statTier').textContent    = state.rewards.tier ?? 'Bronze';

  const orders = readLS('aidify.orders', []).slice(-5).reverse();
  const rows = orders.map(o=>`
    <tr>
      <td>${o.id}</td>
      <td>${new Date(o.createdAt||Date.now()).toLocaleDateString()}</td>
      <td>${money(o.total, state.preferences.currency)}</td>
      <td><span class="badge ${o.status}">${o.status}</span></td>
    </tr>
  `).join('');
  $('#recentOrders').innerHTML = `
    <table class="table" aria-label="Recent orders table">
      <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows || ''}</tbody>
    </table>`;
}

function renderOrders(filter='all'){
  const list = readLS('aidify.orders', []).filter(o=> filter==='all' ? true : (o.status||'open')===filter);
  const rows = list.slice().reverse().map(o=>`
    <tr>
      <td>${o.id}</td><td>${new Date(o.createdAt||Date.now()).toLocaleString()}</td>
      <td>${money(o.total, state.preferences.currency)}</td>
      <td><span class="badge ${o.status}">${o.status||'open'}</span></td>
    </tr>`).join('');
  $('#ordersTable').innerHTML = `
    <table class="table" aria-label="Orders">
      <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows || ''}</tbody>
    </table>`;
  $('#orderFilter').value = filter;
}

function renderWishlist(){
  const grid = $('#wishlistGrid');
  grid.innerHTML = '';
  const ids = readLS('aidify.wishlist', []);
  const all = readLS('aidify.products', []);
  const items = ids.map(id=> all.find(p=>p.id===id)).filter(Boolean);
  if (!items.length){ grid.innerHTML = '<div class="card">Your wishlist is empty.</div>'; return; }
  items.forEach(item=>{
    const el = document.createElement('div');
    el.className = 'wish-card';
    const img = (item.images && item.images[0]) || '';
    el.innerHTML = `
      ${img?`<img class="wish-thumb" src="${img}" alt="${item.title}">`:`<div class="wish-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--muted)"><i class=\"fas fa-image\"></i></div>`}
      <div><strong>${item.title||'Untitled'}</strong></div>
      <div class="subtle">${money(item.price||0, state.preferences.currency)}</div>
      <div class="wish-actions">
        <button class="link primary" data-act="move" data-id="${item.id}">Move to Cart</button>
        <button class="link danger" data-act="remove" data-id="${item.id}">Remove</button>
      </div>
    `;
    grid.appendChild(el);
  });

  grid.onclick = (e)=>{
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    if(btn.dataset.act === 'remove'){
      const next = readLS('aidify.wishlist', []).filter(x=>x!==id); writeLS('aidify.wishlist', next); renderTopbar(); renderWishlist();
    }else if(btn.dataset.act === 'move'){
      const cart = readLS('aidify.cart', []);
      const existing = cart.find(c=>c.id===id);
      if(existing){ existing.qty = (Number(existing.qty)||1) + 1; }
      else {
        const p = (readLS('aidify.products', []).find(x=>x.id===id)) || {}; cart.push({ id, title:p.title, price:p.price, qty:1, img:(p.images&&p.images[0])||'' });
      }
      writeLS('aidify.cart', cart);
      writeLS('aidify.wishlist', readLS('aidify.wishlist', []).filter(x=>x!==id));
      renderTopbar(); renderWishlist(); renderCart(); showView('cart');
    }
  };
}

function renderCart(){
  const wrap = $('#cartTable');
  const cart = readLS('aidify.cart', []);
  if(!cart.length){
    wrap.innerHTML = `<div class="card">Your cart is empty.</div>`;
    $('#cartSummary').innerHTML = '';
    return;
  }
  const rows = cart.map((i, idx)=>`
    <tr data-idx="${idx}">
      <td style="display:flex;align-items:center;gap:8px">
        ${i.img?`<img src="${i.img}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"/>`:''}
        ${i.title||'Untitled'}
      </td>
      <td>${money(i.price, state.preferences.currency)}</td>
      <td>
        <span class="qty" role="group" aria-label="Quantity">
          <button type="button" class="qty-dec" aria-label="Decrease">−</button>
          <span class="qty-val" aria-live="polite">${i.qty||1}</span>
          <button type="button" class="qty-inc" aria-label="Increase">+</button>
        </span>
      </td>
      <td>${money((Number(i.price)||0) * (Number(i.qty)||0), state.preferences.currency)}</td>
      <td><button class="link danger remove-item">Remove</button></td>
    </tr>
  `).join('');
  wrap.innerHTML = `
    <table class="table" aria-label="Cart">
      <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Totals
  const subtotal = cart.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||0), 0);
  const shipping = subtotal > 100 ? 0 : (subtotal>0?5:0);
  const total = subtotal + shipping;
  $('#cartSummary').innerHTML = `
    <div class="total-line"><span>Subtotal</span><strong>${money(subtotal, state.preferences.currency)}</strong></div>
    <div class="total-line"><span>Shipping</span><strong>${money(shipping, state.preferences.currency)}</strong></div>
    <hr class="mt"/>
    <div class="total-line"><span>Total</span><strong>${money(total, state.preferences.currency)}</strong></div>
    <a class="btn mt" href="Checkout.html">Checkout</a>
  `;

  // Bind qty & remove
  wrap.onclick = (e)=>{
    const tr = e.target.closest('tr[data-idx]');
    if(!tr) return;
    const idx = Number(tr.getAttribute('data-idx'));
    const data = readLS('aidify.cart', []);
    if(e.target.closest('.qty-inc')){
      data[idx].qty = (Number(data[idx].qty)||1) + 1;
    }else if(e.target.closest('.qty-dec')){
      data[idx].qty = Math.max(1, (Number(data[idx].qty)||1) - 1);
    }else if(e.target.closest('.remove-item')){
      data.splice(idx,1);
    }else return;
    writeLS('aidify.cart', data);
    renderTopbar();
    renderCart();
  };
}

function renderPayments(){
  const list = $('#cardsList');
  const orders = readLS('aidify.orders', []);
  const lastPayMethods = [...new Set(orders.map(o=>o.paymentMethod).filter(Boolean))];
  const hint = lastPayMethods.length ? `Recent methods: ${lastPayMethods.join(', ')}` : 'No orders yet.';
  list.innerHTML = `<div class="subtle">${hint}</div>` + (state.payments.cards.length ? '' : '');
  state.payments.cards.forEach((card, idx)=>{
    const row = document.createElement('div');
    row.className = 'card-row';
    row.innerHTML = `
      <div>
        <div><strong>${card.cardholder}</strong></div>
        <div class="subtle">${maskCard(card.number)} · ${card.exp}</div>
      </div>
      <button class="link danger" data-remove-card="${idx}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.onclick = (e)=>{
    const btn = e.target.closest('[data-remove-card]');
    if(!btn) return;
    const idx = Number(btn.getAttribute('data-remove-card'));
    state.payments.cards.splice(idx,1);
    saveState(); renderPayments();
  };
}

function renderNotificationsPage(){
  $('#notifOrders').checked   = !!state.notifications.orders;
  $('#notifPromos').checked   = !!state.notifications.promos;
  $('#notifWishlist').checked = !!state.notifications.wishlist;
  // Build a log of order-related notifications
  const orders = readLS('aidify.orders', []);
  const list = document.createElement('div');
  list.className = 'list';
  list.innerHTML = orders.slice().reverse().map(o=>`<div class="card-row"><div>
    <div><strong>Order placed</strong> #${o.id}</div>
    <div class="subtle">${new Date(o.createdAt||Date.now()).toLocaleString()} · Status: ${o.status||'open'} · Payment: ${o.paymentMethod||'—'}</div>
  </div></div>`).join('') || '<div class="subtle">No notifications yet.</div>';
  const container = document.getElementById('view-notifications');
  const existing = container.querySelector('.list');
  if (existing) existing.parentElement.remove();
  const card = document.createElement('div'); card.className = 'card mt'; card.appendChild(list); container.appendChild(card);
}

function renderRewards(){
  $('#rwPoints').textContent = state.rewards.points ?? 0;
  $('#rwTier').textContent = state.rewards.tier ?? 'Bronze';
  $('#rwNextTier').textContent = `${Math.max(0,1000-(state.rewards.points??0))} pts`;
}

function renderReviews(){
  const revs = state.reviews || [];
  $('#reviewsList').innerHTML = revs.map(r=>`
    <div class="card">
      <div class="card-title">${'★'.repeat(r.rating||5)}${'☆'.repeat(5-(r.rating||5))} — ${r.product||'Product'}</div>
      <div class="subtle">${r.date||new Date().toLocaleDateString()}</div>
      <p class="mt">${r.text||'Thanks for your purchase!'}</p>
    </div>
  `).join('') || '<div class="card subtle">No reviews yet.</div>';
}

/* ================= Navigation ================= */
let currentRoute = 'overview';
function routeFromHash(){ const h=(location.hash||'').slice(1); return h||'overview'; }
function handleHashChange(){
  const r = routeFromHash();
  if (r === 'settings'){
    const panel = document.getElementById('settingsPanel');
    if (panel && !panel.classList.contains('open')) openSettings();
    return;
  }
  if (r !== currentRoute){ showView(r); }
}
function showView(route){
  currentRoute = route || 'overview';
  $$('.view').forEach(v=>v.classList.remove('visible'));
  const target = document.getElementById(`view-${currentRoute}`);
  if(target){ target.classList.add('visible'); }
  $$('.nav-link').forEach(l=>l.classList.toggle('active', l.dataset.route===currentRoute));
  if (location.hash !== '#' + currentRoute) { location.hash = '#' + currentRoute; }
  $('#main').focus();
}

/* ================= Settings Panel ================= */
const settingsPanel   = $('#settingsPanel');
const settingsBackdrop= $('#settingsBackdrop');
let previousFocus = null;
let focusTrapHandler = null;
let pendingAvatarDataUrl = null;

function openSettings(){
  if (location.hash !== '#settings') location.hash = '#settings';
  previousFocus = document.activeElement;
  settingsPanel.classList.add('open');
  settingsPanel.setAttribute('aria-hidden','false');
  $('#openSettings').setAttribute('aria-expanded','true');
  settingsBackdrop.hidden = false;

  // preload form
  $('#settingsAvatarPreview').src = state.profile.avatar;
  $('#sName').value = state.profile.name || '';
  $('#sEmail').value = state.profile.email || '';
  $('#sPhone').value = state.profile.phone || '';
  $('#sAddress').value = state.profile.address || '';
  $('#sLanguage').value = state.preferences.language || 'EN';
  $('#sCurrency').value = state.preferences.currency || 'USD';
  $('#sDarkMode').checked = !!state.preferences.darkMode;

  
  // notifications
  $('#sNotifOrders').checked   = !!state.notifications.orders;
  $('#sNotifPromos').checked   = !!state.notifications.promos;
  $('#sNotifWishlist').checked = !!state.notifications.wishlist;

  $('#sName').focus();
  trapFocus(settingsPanel);
}
function closeSettings(){
  untrapFocus();
  settingsPanel.classList.remove('open');
  settingsPanel.setAttribute('aria-hidden','true');
  $('#openSettings').setAttribute('aria-expanded','false');
  settingsBackdrop.hidden = true;
  if(previousFocus) previousFocus.focus();
  if (location.hash === '#settings'){
    const h = '#' + (currentRoute || 'overview');
    if (location.hash !== h) location.hash = h;
  }
}
function trapFocus(container){
  const f = container.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  const first = f[0], last = f[f.length-1];
  focusTrapHandler = (e)=>{
    if(e.key!=='Tab') return;
    if(e.shiftKey && document.activeElement===first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement===last){ first.focus(); e.preventDefault(); }
  };
  container.addEventListener('keydown', focusTrapHandler);
}
function untrapFocus(){ settingsPanel.removeEventListener('keydown', focusTrapHandler); focusTrapHandler = null; }

/* Avatar preview */
$('#avatarInput').addEventListener('change', (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  if(!['image/png','image/jpeg'].includes(file.type)){ alert('PNG/JPG only'); e.target.value=''; return; }
  if(file.size > 2*1024*1024){ alert('Max 2MB'); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = ev => { pendingAvatarDataUrl = ev.target.result; $('#settingsAvatarPreview').src = pendingAvatarDataUrl; };
  reader.readAsDataURL(file);
});

/* Save Settings */
$('#settingsForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  // Profile
  state.profile.name    = $('#sName').value.trim();
  state.profile.email   = $('#sEmail').value.trim();
  state.profile.phone   = $('#sPhone').value.trim();
  state.profile.address = $('#sAddress').value.trim();
  if(pendingAvatarDataUrl){ state.profile.avatar = pendingAvatarDataUrl; pendingAvatarDataUrl = null; $('#avatarInput').value = ''; }
  // Prefs
  state.preferences.language = $('#sLanguage').value;
  state.preferences.currency = $('#sCurrency').value;
  state.preferences.darkMode = $('#sDarkMode').checked;
  // Accessibility settings removed
  // Notifications
  state.notifications.orders   = $('#sNotifOrders').checked;
  state.notifications.promos   = $('#sNotifPromos').checked;
  state.notifications.wishlist = $('#sNotifWishlist').checked;

  saveState();
  applyThemeAndA11y();
  renderTopbar();
  renderOverview();
  renderNotificationsPage();
  renderCart();
  closeSettings();
});

$('#cancelSettings').addEventListener('click', ()=>{ pendingAvatarDataUrl = null; $('#avatarInput').value = ''; closeSettings(); });
$('#closeSettings').addEventListener('click', closeSettings);
$('#settingsBackdrop').addEventListener('click', closeSettings);

document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && settingsPanel.classList.contains('open')) closeSettings(); });

/* ================= Page-specific bindings ================= */
$('#orderFilter').addEventListener('change', (e)=> renderOrders(e.target.value));

$('#addCardForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const holder = $('#cardholder').value.trim();
  const number = $('#cardnumber').value.trim().replace(/\s+/g,'');
  const exp = $('#cardexp').value.trim();
  const cvc = $('#cardcvc').value.trim();
  if(!holder || number.length<12 || !/^\d+$/.test(number)){ alert('Enter a valid card number.'); return; }
  if(!/^\d{2}\/\d{2}$/.test(exp)){ alert('Use MM/YY for expiry.'); return; }
  if(!/^\d{3,4}$/.test(cvc)){ alert('Invalid CVC.'); return; }
  state.payments.cards.push({ cardholder: holder, number, exp });
  saveState(); renderPayments(); e.target.reset(); alert('Card saved locally.');
});

$('#notifForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  state.notifications.orders   = $('#notifOrders').checked;
  state.notifications.promos   = $('#notifPromos').checked;
  state.notifications.wishlist = $('#notifWishlist').checked;
  saveState();
});

$('#supportForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const key='aidify.supportTickets';
  const t = { id: 'T-' + Math.random().toString(36).slice(2,8).toUpperCase(), subject: $('#supportSubject').value.trim(), message: $('#supportMessage').value.trim(), time: Date.now() };
  const arr = readLS(key, []); arr.push(t); writeLS(key, arr);
  alert('Support ticket submitted.');
  e.target.reset();
});

/* Navigation bindings */
$$('.nav-link').forEach(btn=> btn.addEventListener('click', ()=> showView(btn.dataset.route)));
$$('.quick-links .link').forEach(btn=> btn.addEventListener('click', ()=> showView(btn.dataset.route)));
$('#openSettings').addEventListener('click', openSettings);
$('#settingsFromOverview').addEventListener('click', openSettings);
const backBtn = document.getElementById('goBackBtn');
if (backBtn){ backBtn.addEventListener('click', ()=>{ if (window.history.length > 1) window.history.back(); else window.location.href = 'Product.html'; }); }

/* ================= Boot ================= */
function boot(){
  applyThemeAndA11y();
  renderTopbar();
  renderOverview();
  renderOrders('all');
  renderWishlist();
  renderCart();
  renderPayments();
  renderNotificationsPage();
  renderRewards();
  renderReviews();
  const initial = routeFromHash();
  if (initial === 'settings') { openSettings(); } else { showView(initial); }
  window.addEventListener('hashchange', handleHashChange);
}
document.addEventListener('DOMContentLoaded', boot);

// Link the Setup Store button to the setupstore.html page
  document.addEventListener('DOMContentLoaded', function() {
    const setupBtn = document.getElementById('setupStoreBtn');
    if (setupBtn) {
      setupBtn.addEventListener('click', function() {
        window.location.href = 'setupstore.html';
      });
    }
  });
