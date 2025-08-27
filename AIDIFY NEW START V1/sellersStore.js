/* ===========================
   AIDIFY — Sellers Store SPA
   Tech: HTML/CSS/JS (no deps)
   Persistent state via localStorage
=========================== */

const LS = {
  store: "aidify.store",
  products: "aidify.products",
  orders: "aidify.orders",
  messages: "aidify.messages",
  cart: "aidify.cart"
};

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
// Logged-in user info (set by /auth on login)
let __aidifyAuth = null;
try {
  __aidifyAuth = JSON.parse(localStorage.getItem('aidify.auth') || 'null');
} catch(e) { __aidifyAuth = null; }

function getAuth(){
  try{ return JSON.parse(localStorage.getItem('aidify.auth') || 'null'); } catch(e){ return null; }
}

// Populate LS.store from backend for the logged-in user to avoid stale data
(async function hydrateStoreFromBackend(){
  try{
    const auth = getAuth();
    if (!auth || !auth.email) return;
    const res = await fetch(`/api/shops?ownerEmail=${encodeURIComponent(auth.email)}`);
    const data = await res.json();
    if (data && data.success && data.shop) {
      const s = data.shop;
      const storeObj = {
        companyName: s.name || '',
        phone: s.phone || '',
        description: s.description || '',
        image: s.image || null,
        shopId: s.id || null
      };
      write(LS.store, storeObj);
    } else {
      write(LS.store, null);
    }
  }catch(err){
    // leave local store as-is on error
  }
})();

// Defaults
if (!localStorage.getItem(LS.store)) write(LS.store, null);
if (!localStorage.getItem(LS.products)) write(LS.products, []);
if (!localStorage.getItem(LS.orders)) write(LS.orders, []);
if (!localStorage.getItem(LS.messages)) write(LS.messages, []);
if (!localStorage.getItem(LS.cart)) write(LS.cart, []);

// DOM refs
const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const inboxCount = document.getElementById("inboxCount");
const ordersCount = document.getElementById("ordersCount");
const storeNameEl = document.getElementById("storeName");
const storeSubEl = document.getElementById("storeSub");

// Sidebar toggle
if (menuBtn && sidebar){
  menuBtn.addEventListener("click", () => {
    const hidden = sidebar.hasAttribute("hidden");
    sidebar.toggleAttribute("hidden");
    menuBtn.setAttribute("aria-expanded", String(hidden));
  });
}

// Routing
const routes = {
  "/dashboard": renderDashboard,
  "/create-product": renderCreateProduct,
  "/products": renderProducts,
  "/product": renderProductDetails, // /product/:id
  "/orders": renderOrders,
  "/order": renderOrderDetails,     // /order/:id
  "/edit-product": renderEditProduct, // /edit-product/:id
  "/inbox": renderInbox
};
function navigate(hash) {
  let h = (hash || location.hash || '#/dashboard');
  h = String(h).trim();
  if (!h.startsWith('#')) h = '#' + h;
  if (!h.startsWith('#/')) h = '#/' + h.slice(1);
  const parts = h.slice(2).split('/');
  const base = (parts[0] || 'dashboard').toLowerCase();
  const id = parts[1];
  (routes[`/${base}`] || renderDashboard)(id);
  try { if (app && typeof app.focus === 'function') app.focus(); } catch(e) {}
  updateShell();
}
window.addEventListener("hashchange", () => navigate(location.hash));
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  const nav = e.target.closest("[data-nav]");
  const hashAnchor = e.target.closest('a[href^="#"]');
  if (link){ e.preventDefault(); const href = link.getAttribute("href"); if (href) location.hash = href; return; }
  if (nav){ e.preventDefault(); const dest = nav.dataset.nav || nav.getAttribute('href'); if (dest) location.hash = dest; return; }
  if (hashAnchor){ e.preventDefault(); const href = hashAnchor.getAttribute('href'); if (href) location.hash = href; }
});

// Shell updates
function updateShell() {
  const msgs = read(LS.messages, []);
  const orders = read(LS.orders, []);
  if (inboxCount) inboxCount.textContent = msgs.length;
  if (ordersCount) ordersCount.textContent = orders.length;

  const auth = getAuth();
  if (auth && auth.email) {
    fetch(`/api/shops?ownerEmail=${encodeURIComponent(auth.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.shop) {
          if (storeNameEl) storeNameEl.textContent = data.shop.name || "Your store isn’t set up";
          if (storeSubEl) storeSubEl.textContent = data.shop.description || "Let’s get you started";
          const avatar = document.getElementById("storeAvatar");
          if (avatar && data.shop.image) avatar.innerHTML = `<img src="${data.shop.image}" alt="Store image" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
        } else {
          if (storeNameEl) storeNameEl.textContent = "Your store isn’t set up";
          if (storeSubEl) storeSubEl.textContent = "Let’s get you started";
        }
      })
      .catch(() => {
        if (storeNameEl) storeNameEl.textContent = "Your store isn’t set up";
        if (storeSubEl) storeSubEl.textContent = "Let’s get you started";
      });
  } else {
    if (storeNameEl) storeNameEl.textContent = "Your store isn’t set up";
    if (storeSubEl) storeSubEl.textContent = "Let’s get you started";
  }
}

// Utilities
function $(sel, root=document){ return root.querySelector(sel); }
function el(html){ const d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }
function getUserCountry(){ try{ const a=JSON.parse(localStorage.getItem('aidify.auth')||'null'); return a && a.country; }catch(e){ return null; } }
function mapCountryToCurrency(country){ if(!country) return 'USD'; const c=String(country).toLowerCase(); if(c.includes('cameroon')) return 'XAF'; if(c.includes('nigeria')) return 'NGN'; if(c.includes('ghana')) return 'GHS'; if(c.includes('south africa')) return 'ZAR'; if(c.includes('united kingdom')||c.includes('uk')) return 'GBP'; if(c.includes('united states')||c.includes('usa')) return 'USD'; if(c.includes('france')||c.includes('germany')||c.includes('italy')||c.includes('spain')||c.includes('netherlands')) return 'EUR'; return 'USD'; }
const FX_RATES = { USD:1, XAF:600, XOF:600, NGN:1500, GHS:16, ZAR:18.5, EUR:0.92, GBP:0.78 };
function fmt(n){ const code=mapCountryToCurrency(getUserCountry()); const rate=FX_RATES[code]||1; const amount=Number(n||0)*rate; const maxFrac=(code==='XAF'||code==='XOF'||code==='NGN')?0:2; try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:code, maximumFractionDigits:maxFrac}).format(amount);}catch(e){ return amount.toFixed(maxFrac)+' '+code; } }
function escapeHTML(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m])); }
function uid(){ return Math.random().toString(36).slice(2,10); }
function ensureCategories(){ const select = document.getElementById("filterCategory"); if (!select) return; const cats = [...new Set(read(LS.products, []).map(p=>p.category).filter(Boolean))]; select.innerHTML = `<option value="">All categories</option>` + cats.map(c=>`<option>${escapeHTML(c)}</option>`).join(""); }

// Views
function renderDashboard(){
  app.innerHTML = document.getElementById("tmpl-dashboard").innerHTML;
  drawSparklines();
  const orders = read(LS.orders, []);
  const total = orders.reduce((s,o)=> s + Number(o.total||0), 0);
  const revEl = document.getElementById('statRevenue'); if (revEl) revEl.textContent = fmt(total);

  // Update product count from backend
  (async ()=>{
    try{
      let count = 0; let shopId = null;
  const auth = getAuth();
  if (auth && auth.email){
        try{
          const shopRes = await fetch(`/api/shops?ownerEmail=${encodeURIComponent(auth.email)}`);
          const shopData = await shopRes.json();
          if (shopData && shopData.success && shopData.shop && shopData.shop.id){ shopId = shopData.shop.id; }
        }catch(e){ /* ignore and fallback */ }
      }
      if (shopId){
        const res = await fetch(`/api/products?shopId=${shopId}`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.products)) count = data.products.length;
      } else {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.products)) count = data.products.length;
      }
      const pv = document.getElementById('statProducts'); if (pv) pv.textContent = String(count);
    }catch(err){
      const pv = document.getElementById('statProducts'); if (pv) pv.textContent = String(read(LS.products, []).length);
    }
  })();
}

function drawSparklines(){
  const datasets = {
    sparkProducts: generateRandomTrend(read(LS.products, []).length),
    sparkOrders: generateRandomTrend(read(LS.orders, []).length),
    sparkMsgs: generateRandomTrend(read(LS.messages, []).length),
    sparkRevenue: generateRandomTrend(Math.round(read(LS.orders, []).reduce((s,o)=>s+Number(o.total||0),0)/100)||1)
  };
  Object.entries(datasets).forEach(([id,data])=>{
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.clientWidth || 220; const h = c.clientHeight || 48;
    c.width = w; c.height = h;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    const max = Math.max(...data);
    const stepX = w / (data.length-1);
    ctx.beginPath();
    data.forEach((v,i)=>{
      const x = i*stepX;
      const y = h - (v/max)*h*0.9 - 2;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,'rgba(255,255,255,.25)');
    grad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
  });
}

function generateRandomTrend(seed){
  const len = 16; const arr = []; let base = Math.max(1, seed || 1);
  for (let i=0;i<len;i++){
    const jitter = Math.max(0, base + Math.round((Math.random()-.4)*base*0.3));
    arr.push(jitter);
    base = Math.max(1, jitter + (Math.random()>.5?1:-1));
  }
  return arr;
}

function renderCreateProduct() {
  app.innerHTML = document.getElementById("tmpl-create-product").innerHTML;
  const pFiles = document.getElementById("pFiles");
  const pPreview = document.getElementById("pPreview");
  let images = []; // [{file, preview}]

  function drawPreview(){
    pPreview.innerHTML = "";
    images.forEach((it, idx)=>{
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.style.marginRight = '8px';
      const img = document.createElement('img');
      img.src = it.preview; img.alt = `Product image ${idx+1}`;
      img.style.maxWidth = '120px'; img.style.maxHeight = '120px';
      img.style.objectFit = 'cover'; img.style.borderRadius = '8px';
      const controls = document.createElement('div');
      controls.style.position = 'absolute'; controls.style.top = '4px'; controls.style.right = '4px';
      controls.innerHTML = `
        <button type="button" data-up="${idx}" style="margin-right:4px">⬆️</button>
        <button type="button" data-down="${idx}" style="margin-right:4px">⬇️</button>
        <button type="button" data-del="${idx}">✕</button>
      `;
      wrap.appendChild(img); wrap.appendChild(controls); pPreview.appendChild(wrap);
    });
  }

  if (pFiles){
    pFiles.addEventListener("change", () => {
      const files = [...(pFiles.files || [])].slice(0, 12);
      images = files.map(f=>({ file:f, preview: URL.createObjectURL(f) }));
      drawPreview();
    });
  }

  pPreview.addEventListener('click', (e)=>{
    const up = e.target.getAttribute('data-up');
    const down = e.target.getAttribute('data-down');
    const del = e.target.getAttribute('data-del');
    if (up){ const i = Number(up); if (i>0){ [images[i-1], images[i]] = [images[i], images[i-1]]; drawPreview(); } }
    if (down){ const i = Number(down); if (i<images.length-1){ [images[i+1], images[i]] = [images[i], images[i+1]]; drawPreview(); } }
    if (del){ const i = Number(del); images.splice(i,1); drawPreview(); }
  });

  document.getElementById("saveDraftBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); saveProduct(false); });
  document.getElementById("productForm")?.addEventListener("submit", (e)=>{ e.preventDefault(); saveProduct(true); });

  async function saveProduct(publish){
    if (saveProduct._submitting) return; saveProduct._submitting = true;
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    const draftBtn = document.getElementById('saveDraftBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = publish ? 'Publishing...' : 'Saving...'; }
    if (draftBtn) draftBtn.disabled = true;

    const title = document.getElementById("pTitle").value.trim();
    const category = document.getElementById("pCategory").value.trim() || "General";
    const price = parseFloat(document.getElementById("pPrice").value || "0");
    const stock = parseInt(document.getElementById("pStock").value || "0", 10);
    const desc = document.getElementById("pDesc").value.trim();

    if (!title){ alert("Please provide a title"); if (submitBtn){ submitBtn.disabled=false; submitBtn.textContent = publish? 'Publish product':'Save'; } if (draftBtn) draftBtn.disabled=false; saveProduct._submitting=false; return; }
    if (!images.length){ alert('Please add at least one image'); if (submitBtn){ submitBtn.disabled=false; submitBtn.textContent = publish? 'Publish product':'Save'; } if (draftBtn) draftBtn.disabled=false; saveProduct._submitting=false; return; }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('price', String(price));
    formData.append('category', category);
    formData.append('stock', String(stock));
    formData.append('status', publish ? 'published' : 'draft');
    const store = read(LS.store, null);
    if (store && store.shopId) formData.append('shopId', String(store.shopId));
    else {
      const auth = getAuth();
      if (auth && auth.email) formData.append('ownerEmail', auth.email);
    }
    images.slice(0,12).forEach(it=>{ if (it.file) formData.append('images', it.file); });

    try{
      const resp = await fetch('/api/products', { method: 'POST', body: formData });
      const text = await resp.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }
      if (resp.ok && data && (data.success || data.productId)){
        alert(publish ? 'Product published!' : 'Draft saved.');
        location.hash = '#/products';
      } else {
        const msg = (data && data.message) || `Failed to save product${resp.status?` (HTTP ${resp.status})`:''}.`;
        alert(msg);
      }
    } catch(err){
      console.error('create product failed:', err);
      alert('Could not save product. Please try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = publish ? 'Publish product' : 'Save'; }
      if (draftBtn) draftBtn.disabled = false;
      saveProduct._submitting = false;
    }
  }
}

function renderProducts() {
  app.innerHTML = document.getElementById("tmpl-products").innerHTML;
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("searchInput");
  const filter = document.getElementById("filterCategory");

  let products = [];
  async function fetchProducts(){
    try{
      // Try to fetch products for the logged-in user's shop first
  let fetched = false;
  const auth = getAuth();
      if (auth && auth.email) {
        try{
          const shopRes = await fetch(`/api/shops?ownerEmail=${encodeURIComponent(auth.email)}`);
          const shopData = await shopRes.json();
          if (shopData && shopData.success && shopData.shop && shopData.shop.id) {
            const shopId = shopData.shop.id;
            const res = await fetch(`/api/products?shopId=${shopId}`);
            const data = await res.json();
            if (data && data.success && Array.isArray(data.products)) { products = data.products; fetched = true; }
          }
        }catch(e){ /* ignore and fallback to global */ }
      }
      // If not fetched for a specific shop, do NOT fall back to global listing
      // Showing global products on a seller's dashboard causes cross-account leakage.
      if (!fetched) {
        products = []; // no shop -> no products to manage
      }
  }catch(e){ products = read(LS.products, []); }
    draw(); ensureCategories();
  }

  function draw(){
    const q = (search?.value || '').toLowerCase();
    const cat = filter?.value || '';
    const list = (products||[]) 
      .filter(p=> !q || (p.title||'').toLowerCase().includes(q))
      .filter(p=> !cat || p.category===cat)
      .sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    grid.innerHTML = list.length ? list.map(cardProduct).join("") : "<div style='padding:2em;text-align:center;color:#888;'>No products found.</div>";
  }

  search?.addEventListener("input", draw);
  filter?.addEventListener("change", draw);
  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-edit]');
    if (btn){ location.hash = `#/edit-product/${btn.getAttribute('data-edit')}`; }
  });
  fetchProducts();
}

function cardProduct(p){
  const img = escapeHTML((p.images && p.images[0]) || "");
  return `
    <article class="card-prod">
      <img src="${img}" alt="${escapeHTML(p.title||'Untitled')} image">
      <div class="pad">
        <div class="title">${escapeHTML(p.title||'Untitled')}</div>
        <div class="row" style="justify-content:space-between;">
          <div class="price">${fmt(p.price)}</div>
          <div class="meta">${escapeHTML(p.category||"General")}</div>
        </div>
        <div class="row gap-sm mt-sm">
          <a class="pill-btn" href="#/product/${p.id}" data-link>Details</a>
          <button class="ghost-btn" data-edit="${p.id}">Edit</button>
          <button class="ghost-btn" data-buy="${p.id}">Buy</button>
        </div>
      </div>
    </article>
  `;
}

function renderEditProduct(id){
  // reuse create-product template for editing
  app.innerHTML = document.getElementById("tmpl-create-product").innerHTML;
  const products = read(LS.products, []);
  const idx = products.findIndex(x=>x.id===id);
  if (idx<0){ app.innerHTML = '<section class="panel"><p>Product not found.</p></section>'; return; }
  const p = products[idx];
  // Tweak header/UI
  const hdr = app.querySelector('.panel-header h2'); if(hdr) hdr.textContent = 'Edit product';
  const sub = app.querySelector('.panel-header p'); if(sub) sub.textContent = 'Update product details and save your changes.';
  const saveDraftBtn = document.getElementById('saveDraftBtn'); if (saveDraftBtn) saveDraftBtn.style.display='none';
  const cta = app.querySelector('.actions .cta'); if (cta) cta.textContent = 'Save changes';

  const pFiles = document.getElementById("pFiles");
  const pPreview = document.getElementById("pPreview");
  let imageDataUrls = (p.images||[]).slice();

  function drawPreview(){
    pPreview.innerHTML = "";
    imageDataUrls.forEach((url, idx)=>{
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.style.marginRight = '8px';
      const img = document.createElement('img');
      img.src = url; img.alt = `Product image ${idx+1}`;
      img.style.maxWidth = '120px'; img.style.maxHeight = '120px';
      img.style.objectFit = 'cover'; img.style.borderRadius = '8px';
      const controls = document.createElement('div');
      controls.style.position = 'absolute'; controls.style.top = '4px'; controls.style.right = '4px';
      controls.innerHTML = `
        <button type="button" data-up="${idx}" style="margin-right:4px">⬆️</button>
        <button type="button" data-down="${idx}" style="margin-right:4px">⬇️</button>
        <button type="button" data-del="${idx}">✕</button>
      `;
      wrap.appendChild(img); wrap.appendChild(controls); pPreview.appendChild(wrap);
    });
  }
  drawPreview();

  pFiles.addEventListener("change", async () => {
    const files = [...(pFiles.files || [])].slice(0, 12);
    for (const file of files) {
      const url = await fileToDataURL(file);
      imageDataUrls.push(url);
    }
    drawPreview();
  });
  pPreview.addEventListener('click', (e)=>{
    const up = e.target.getAttribute('data-up');
    const down = e.target.getAttribute('data-down');
    const del = e.target.getAttribute('data-del');
    if (up){ const i = Number(up); if (i>0){ [imageDataUrls[i-1], imageDataUrls[i]] = [imageDataUrls[i], imageDataUrls[i-1]]; drawPreview(); } }
    if (down){ const i = Number(down); if (i<imageDataUrls.length-1){ [imageDataUrls[i+1], imageDataUrls[i]] = [imageDataUrls[i], imageDataUrls[i+1]]; drawPreview(); } }
    if (del){ const i = Number(del); imageDataUrls.splice(i,1); drawPreview(); }
  });

  // Prefill fields
  document.getElementById("pTitle").value = p.title||'';
  document.getElementById("pCategory").value = p.category||'';
  document.getElementById("pBrand").value = p.brand||'';
  document.getElementById("pCondition").value = p.condition||'New';
  document.getElementById("pSKU").value = p.sku||'';
  document.getElementById("pPrice").value = String(p.price||0);
  document.getElementById("pPriceCompare").value = String(p.priceCompare||'');
  document.getElementById("pStock").value = String(p.stock||'');
  document.getElementById("pTrackInv").checked = !!p.trackInv;
  document.getElementById("pTags").value = (p.tags||[]).join(', ');
  document.getElementById("pWeight").value = String(p.weight||'');
  document.getElementById("pLen").value = String(p.length||'');
  document.getElementById("pWid").value = String(p.width||'');
  document.getElementById("pHei").value = String(p.height||'');
  document.getElementById("pDesc").value = p.description||'';
  const specsText = (p.specs||[]).map(s=> `${s.key}: ${s.value}`).join('\n');
  document.getElementById("pSpecs").value = specsText;

  // Save changes handler
  const form = document.getElementById('productForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const updated = { ...p };
    updated.title = document.getElementById("pTitle").value.trim();
    updated.category = document.getElementById("pCategory").value.trim() || "General";
    updated.brand = document.getElementById("pBrand").value.trim();
    updated.condition = document.getElementById("pCondition").value;
    updated.sku = document.getElementById("pSKU").value.trim();
    updated.price = parseFloat(document.getElementById("pPrice").value || "0");
    updated.priceCompare = parseFloat(document.getElementById("pPriceCompare").value || "0");
    updated.stock = parseInt(document.getElementById("pStock").value || "0", 10);
    updated.trackInv = document.getElementById("pTrackInv").checked;
    updated.tags = document.getElementById("pTags").value.split(",").map(t=>t.trim()).filter(Boolean);
    updated.weight = parseFloat(document.getElementById("pWeight").value || "0");
    updated.length = parseFloat(document.getElementById("pLen").value || "0");
    updated.width = parseFloat(document.getElementById("pWid").value || "0");
    updated.height = parseFloat(document.getElementById("pHei").value || "0");
    updated.description = document.getElementById("pDesc").value.trim();
    const specsLines = document.getElementById("pSpecs").value.trim();
    updated.specs = specsLines ? specsLines.split(/\n+/).map(line=>{ const [k,...rest]=line.split(":"); return { key:(k||'').trim(), value:rest.join(":").trim() }; }).filter(s=>s.key) : [];
    updated.images = imageDataUrls.slice();
    updated.updatedAt = Date.now();

    products[idx] = updated;
    write(LS.products, products);
    alert('Product updated.');
    location.hash = `#/product/${updated.id}`;
  });
}

async function renderProductDetails(id){
  const products = read(LS.products, []);
  let p = products.find(x=>x.id===id);
  // If not found locally, try fetching from backend (public product view)
  if (!p) {
    try{
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data && data.success && data.product) p = data.product;
    }catch(e){ /* ignore */ }
  }
  if (!p){ app.innerHTML = `<section class="panel"><p>Product not found.</p></section>`; return; }

  app.innerHTML = document.getElementById("tmpl-product-details").innerHTML;
  document.getElementById("pdCrumb").textContent = p.title;
  document.getElementById("pdTitle").textContent = p.title;
  const priceLabel = p.priceCompare && p.priceCompare>p.price ? `${fmt(p.price)} <s style="color:var(--c-muted)">${fmt(p.priceCompare)}</s>` : fmt(p.price);
  document.getElementById("pdPrice").innerHTML = priceLabel;
  document.getElementById("pdCategory").textContent = p.category || "General";
  const metaParts = [];
  if (p.brand) metaParts.push(`Brand: ${escapeHTML(p.brand)}`);
  if (p.condition) metaParts.push(`Condition: ${escapeHTML(p.condition)}`);
  if (p.sku) metaParts.push(`SKU: ${escapeHTML(p.sku)}`);
  if (p.stock) metaParts.push(`In stock: ${escapeHTML(String(p.stock))}`);
  if (p.weight) metaParts.push(`Weight: ${escapeHTML(String(p.weight))} kg`);
  const dims = [p.length,p.width,p.height].filter(Boolean);
  if (dims.length) metaParts.push(`Dimensions: ${[p.length,p.width,p.height].filter(Boolean).join(' × ')} cm`);
  document.getElementById("pdMeta").innerHTML = metaParts.join(" · ");
  if (p.tags?.length){ document.getElementById("pdTags").innerHTML = p.tags.map(t=>`<span class="pill-btn" style="background:rgba(68,187,164,.12); color:var(--c-ink);">#${escapeHTML(t)}</span>`).join(" "); }
  document.getElementById("pdDesc").textContent = p.description || "No description.";
  if (p.specs?.length){ const ul = document.createElement('ul'); ul.style.paddingLeft = '18px'; p.specs.forEach(s=>{ const li=document.createElement('li'); li.textContent = `${s.key}: ${s.value}`; ul.appendChild(li); }); document.getElementById("pdSpecs").appendChild(ul); }

  // Gallery
  const g = document.getElementById("pdGallery");
  const main = el(`<img alt="${escapeHTML(p.title)} main image" src="${escapeHTML(p.images[0])}">`);
  const thumbs = el(`<div class="thumbs"></div>`);
  p.images.forEach((src,i)=>{ const t=el(`<img alt="thumbnail ${i+1}" src="${escapeHTML(src)}">`); t.addEventListener("click",()=> main.src=src); thumbs.appendChild(t); });
  g.appendChild(main); g.appendChild(thumbs);

  // Related
  const related = products.filter(x=>x.id!==p.id && x.category===p.category && x.status==="published").slice(0,6);
  document.getElementById("relatedGrid").innerHTML = related.map(cardProduct).join("") || `<div class="empty"><p>No related products yet.</p></div>`;

  // Buyer actions
  document.getElementById("btnAddCart").addEventListener("click", ()=>{ addToCart(p); alert("Added to cart."); });
  document.getElementById("btnBuyNow").addEventListener("click", ()=>{ addToCart(p); placeOrderFromCart(); });

  // Message seller
  document.getElementById("msgSellerForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const msgs = read(LS.messages, []);
    msgs.push({ id:uid(), productId:p.id, from:document.getElementById("buyerName").value||"Buyer", body:document.getElementById("buyerMsg").value.trim(), time:Date.now() });
    write(LS.messages, msgs); updateShell(); e.target.reset(); alert("Message sent to seller.");
  });

  // Delegate buy on related
  document.addEventListener("click", onRelatedBuyClick);
  function onRelatedBuyClick(e){
    const btn = e.target.closest("button[data-buy]");
    if (!btn) return;
    const prod = read(LS.products, []).find(x=>x.id===btn.dataset.buy);
    if (prod){ addToCart(prod); alert("Added to cart."); }
  }
  window.addEventListener("hashchange", ()=> document.removeEventListener("click", onRelatedBuyClick), { once:true });
}

function renderOrders(){
  app.innerHTML = document.getElementById("tmpl-orders").innerHTML;
  const tbody = document.getElementById("ordersBody");
  const orders = read(LS.orders, []);
  tbody.innerHTML = orders.slice().reverse().map(rowOrder).join("") || `<tr><td colspan="6">No orders yet.</td></tr>`;
  tbody.addEventListener("click", (e)=>{
    const row = e.target.closest('tr');
    const od = row ? row.getAttribute('data-id') : null;
    const markId = e.target.getAttribute("data-mark");
    if (od && !markId) { location.hash = `#/order/${od}`; return; }
    if (!markId) return;
    const os = read(LS.orders, []);
    const o = os.find(x=>x.id===markId);
    o.status = nextStatus(o.status); write(LS.orders, os); renderOrders(); updateShell();
  });
}
function rowOrder(o){
  return `<tr data-id="${o.id}">
    <td>#${o.id}</td><td>${escapeHTML(o.buyer?.fullName || o.buyer || 'Buyer')}</td>
    <td>${escapeHTML(o.productTitle || (o.items && o.items.length ? `${o.items.length} item(s)` : '—'))}</td><td>${fmt(o.total)}</td>
    <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
    <td><button class="ghost-btn" data-mark="${o.id}">Mark as ${nextStatus(o.status)}</button></td>
  </tr>`;
}

function renderOrderDetails(id){
  const tpl = document.getElementById('tmpl-order-details');
  if (!tpl){ app.innerHTML = `<section class="panel"><p>Order view not available.</p></section>`; return; }
  const orders = read(LS.orders, []);
  const o = orders.find(x=>x.id===id);
  if (!o){ app.innerHTML = `<section class="panel"><p>Order not found.</p></section>`; return; }
  app.innerHTML = tpl.innerHTML;
  const title = `Order #${o.id}`;
  document.getElementById('odCrumb').textContent = o.id;
  document.getElementById('odTitle').textContent = title;
  document.getElementById('odMeta').textContent = new Date(o.createdAt || o.time || Date.now()).toLocaleString();
  const statusEl = document.getElementById('odStatus');
  statusEl.textContent = o.status || 'open';
  statusEl.className = `status ${statusClass(o.status||'open')}`;
  const markBtn = document.getElementById('odMarkBtn');
  const setMarkBtn = ()=> markBtn.textContent = `Mark as ${nextStatus(o.status||'open')}`;
  setMarkBtn();
  markBtn.addEventListener('click', ()=>{
    const os = read(LS.orders, []);
    const idx = os.findIndex(x=>x.id===o.id);
    if (idx>=0){ os[idx].status = nextStatus(os[idx].status || 'open'); write(LS.orders, os); updateShell(); renderOrderDetails(id); }
  });

  // Buyer
  const b = o.buyer || {};
  document.getElementById('odBuyer').innerHTML = `
    <div><strong>${escapeHTML(b.fullName || String(b))}</strong></div>
    ${b.email?`<div>${escapeHTML(b.email)}</div>`:''}
    ${b.phone?`<div>${escapeHTML(b.phone)}</div>`:''}
    ${b.address?`<div>${escapeHTML(b.address)}</div>`:''}
    ${b.city||b.state||b.postal||b.country?`<div>${[b.city,b.state,b.postal,b.country].filter(Boolean).map(escapeHTML).join(', ')}</div>`:''}
  `;

  // Payment and shipping
  const pay = o.paymentMethod || '—';
  const ship = o.deliveryMethod || '—';
  document.getElementById('odPayShip').innerHTML = `
    <div>Payment method: <strong>${escapeHTML(pay)}</strong></div>
    <div>Delivery method: <strong>${escapeHTML(ship)}</strong></div>
  `;

  // Items table
  const items = o.items && o.items.length ? o.items : (o.productId ? [{ id:o.productId, title:o.productTitle, qty:1, price:o.total }] : []);
  const tbody = document.getElementById('odItems');
  tbody.innerHTML = items.map(it=>`<tr>
    <td>${escapeHTML(it.title || '—')}</td>
    <td>${escapeHTML(String(it.qty||1))}</td>
    <td>${fmt(it.price)}</td>
    <td>${fmt((Number(it.price)||0)*(Number(it.qty)||0))}</td>
  </tr>`).join('');

  // Totals
  const subtotal = items.reduce((s,i)=> s + (Number(i.price)||0) * (Number(i.qty)||0), 0);
  const shipping = Number(o.shipping || 0);
  const total = Number(o.total || (subtotal + shipping));
  document.getElementById('odSubtotal').textContent = fmt(subtotal);
  document.getElementById('odShipping').textContent = fmt(shipping);
  document.getElementById('odTotal').textContent = fmt(total);
}
const statusFlow = ["open","paid","shipped"];
const statusClass = s => s==="open"?"s-open":(s==="paid"?"s-paid":"s-shipped");
const nextStatus = s => statusFlow[(statusFlow.indexOf(s)+1)%statusFlow.length];

function renderInbox(){
  app.innerHTML = document.getElementById("tmpl-inbox").innerHTML;
  const msgs = read(LS.messages, []);
  document.getElementById("msgList").innerHTML = msgs.slice().reverse().map(m=>`
    <li class="msg">
      <div class="from">${escapeHTML(m.from)}</div>
      <div class="meta">${new Date(m.time).toLocaleString()}</div>
      <div class="body">${escapeHTML(m.body)}</div>
      <div class="meta">Regarding: <a href="#/product/${m.productId}" data-link>View product</a></div>
    </li>
  `).join("") || `<li class="msg">Inbox is empty.</li>`;
}

// Buyer/cart simulation
function addToCart(p){
  const cart = read(LS.cart, []);
  const existing = cart.find(i=>i.id===p.id);
  if (existing) existing.qty += 1; else cart.push({ id:p.id, qty:1, price:p.price, title:p.title });
  write(LS.cart, cart);
}
function placeOrderFromCart(){
  const cart = read(LS.cart, []);
  if (!cart.length) return alert("Cart is empty");
  const products = read(LS.products, []);
  const orders = read(LS.orders, []);
  cart.forEach(item=>{
    const prod = products.find(p=>p.id===item.id);
    orders.push({ id:uid(), buyer:"Guest", productId:prod?.id||item.id, productTitle:prod?.title||item.title, total:item.price*item.qty, status:"open", time:Date.now() });
  });
  write(LS.orders, orders); write(LS.cart, []); alert("Order placed!"); updateShell(); location.hash="#/orders";
}

// Export & reset
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");
if (exportBtn) exportBtn.addEventListener("click", ()=>{
  const dump = { settings:read(LS.settings,{}), store:read(LS.store,null), products:read(LS.products,[]), orders:read(LS.orders,[]), messages:read(LS.messages,[]) };
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="aidify-export.json"; a.click(); URL.revokeObjectURL(url);
});
if (resetBtn) resetBtn.addEventListener("click", ()=>{
  if (!confirm("This will clear all AIDIFY data in your browser. Continue?")) return;
  Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload();
});

// Helpers
function placeholderImage(seed){
  const bg="ececec", text=encodeURIComponent((seed||'').slice(0,18));
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
    <rect width='100%' height='100%' fill='#${bg}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial' font-size='32' fill='#666'>${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}
function fileToDataURL(file){
  return new Promise((res, rej)=>{
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// Boot
navigate(); updateShell();
