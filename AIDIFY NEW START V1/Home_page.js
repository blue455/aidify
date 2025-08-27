// AIDIFY Home Page JavaScript (live data integrated)
// Import centralized accessibility manager (if present)
const ACCESSIBILITY_MANAGER = window.AIDIFY_ACCESSIBILITY;

document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  loadProducts(); // now loads Featured (likes) + New Arrivals from live data
  setupEventListeners();
  setupAccessibility();
  setupAccessibilityWidget();
});

// ===== Helpers for live data =====
function lsGet(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } }
let __aidifyProducts = [];
async function fetchBackendProducts(){
  try{
    const res = await fetch('/api/products');
    const data = await res.json();
    __aidifyProducts = (data && data.success && Array.isArray(data.products)) ? data.products : [];
  }catch(e){ __aidifyProducts = []; }
}
function getLiveProducts(){ return (__aidifyProducts||[]).filter(p=>p && p.status==='published'); }
function getLikes(){ return lsGet('aidify.likes', [])||[]; }
function getCart(){ return lsGet('aidify.cart', [])||[]; }
function setCart(c){ localStorage.setItem('aidify.cart', JSON.stringify(c)); }
function getWishlistLS(){ return lsGet('aidify.wishlist', [])||[]; }
function setWishlistLS(a){ localStorage.setItem('aidify.wishlist', JSON.stringify(a)); }

// ===== Initialize page components =====
function initializePage() {
  setupStickyNav();
  loadUserPreferences();
  initAnimations();
  initHeroProductsCarousel();
}

// ===== Sticky Navigation (supports product navbar classes) =====
function setupStickyNav() {
  const navbarA = document.querySelector('.navbar');
  const navbarB = document.querySelector('.nav-container');
  const mobileBtn = document.querySelector('.mobile-menu-button');
  const menu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (navbarA){
      if (window.scrollY > 100) navbarA.classList.add('sticky'); else navbarA.classList.remove('sticky');
    }
    if (navbarB){
      if (window.scrollY > 10) navbarB.classList.add('is-sticky'); else navbarB.classList.remove('is-sticky');
    }
  });

  if (mobileBtn && menu){ mobileBtn.addEventListener('click', ()=> menu.classList.toggle('open')); }

  // Close menu when clicking on links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => { if(menu) menu.classList.remove('open'); });
  });
}

// ===== Load products into grids =====
async function loadProducts() {
  await fetchBackendProducts();
  loadTopProducts();      // Featured from likes
  loadNewArrivals();      // New arrivals from createdAt
  loadRecommendations();  // Basic recommendations (from live + sample fallback)
}

function productToCardModel(p){
  return {
    id: p.id,
    name: p.title || p.name || 'Untitled',
    price: Number(p.price||0),
    oldPrice: p.priceCompare ? Number(p.priceCompare) : undefined,
    image: (p.images && p.images[0]) || p.image || '',
    category: p.category || '',
    rating: p.rating || 4.5, // fallback rating
    description: p.description || ''
  };
}

function loadTopProducts() {
  const grid = document.getElementById('topProductsGrid');
  if (!grid) return;
  const live = getLiveProducts();
  const likes = getLikes();
  const likedItems = likes
    .map(id => live.find(p=> String(p.id)===String(id)))
    .filter(Boolean)
    .map(productToCardModel);

  let featuredList = likedItems;
  if (!featuredList.length){
    featuredList = live.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,6).map(productToCardModel);
  }
  grid.innerHTML = featuredList.map(createProductCard).join('');
  if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(grid);
}

function loadNewArrivals() {
  const grid = document.getElementById('newArrivalsGrid');
  if (!grid) return;
  const live = getLiveProducts();
  const arrivals = live.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,8).map(productToCardModel);
  grid.innerHTML = arrivals.map(createProductCard).join('');
  if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(grid);
}

function loadRecommendations() {
  const grid = document.getElementById('recommendationsGrid');
  if (!grid) return;
  const live = getLiveProducts().map(productToCardModel);
  // Fallback sample (legacy) if no live products
  let recommendations = live.length ? live : (sampleProducts||[]);
  // Sort by price descending as a simple stand-in for popularity
  recommendations = recommendations.slice().sort((a,b)=> (b.rating||0) - (a.rating||0)).slice(0,4);
  grid.innerHTML = recommendations.map(createProductCard).join('');
  if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(grid);
}

// ===== Card render =====
function createProductCard(product) {
  const oldPrice = product.oldPrice ? `
        <span class="old-price" data-price-usd="${product.oldPrice}" style="text-decoration: line-through; color: var(--muted); margin-left: 8px;"></span>
    ` : '';
  const ratingStars = '★'.repeat(Math.floor(product.rating||4)) + '☆'.repeat(5 - Math.floor(product.rating||4));
  const id = typeof product.id==='string' ? `'${product.id}'` : product.id;
  return `
        <div class="product-card" data-id="${product.id}" onclick="showProductDetails(${id})">
            ${product.image?`<img src="${product.image}" alt="${product.name}" class="product-image">`:`<div class="product-image" style="display:flex;align-items:center;justify-content:center;color:var(--muted)"><i class=\"fas fa-image\"></i></div>`}
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">
                <span class="price" data-price-usd="${product.price}"></span>${oldPrice}
            </div>
            <div class="product-rating">
                ${ratingStars} (${product.rating||4.5})
            </div>
            <div class="product-actions">
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${id})">Add to Cart</button>
                <button class="wishlist-btn" onclick="event.stopPropagation(); addToWishlist(${id})">♡</button>
            </div>
        </div>
    `;
}

// ===== Modal details (supports live products) =====
function findAnyProductById(productId){
  const live = getLiveProducts();
  let p = live.find(x=> String(x.id)===String(productId));
  if (p) return productToCardModel(p);
  const all = [...(sampleProducts||[]), ...(newArrivals||[])];
  return all.find(x=> String(x.id)===String(productId));
}

function showProductDetails(productId) {
  const product = findAnyProductById(productId);
  if (!product) return;
  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  const oldPrice = product.oldPrice ? `
        <span data-price-usd="${product.oldPrice}" style="text-decoration: line-through; color: var(--muted); margin-left: 10px;"></span>` : '';
  const features = product.features ? `
        <div class="product-features"><h4>Features:</h4><ul>${product.features.map(feature => `<li>${feature}</li>`).join('')}</ul></div>` : '';

  modalBody.innerHTML = `
        <div class="product-details">
            ${product.image?`<img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">`:''}
            <h2>${product.name}</h2>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 10px 0;">
                <span data-price-usd="${product.price}"></span>${oldPrice}
            </div>
            <div style="color: var(--accent); margin: 10px 0;">
                ${'★'.repeat(Math.floor(product.rating||4))}${'☆'.repeat(5 - Math.floor(product.rating||4))} (${product.rating||4.5})
            </div>
            <p>${product.description||''}</p>
            ${features}
            <div style="margin-top: 20px;">
                <button class="add-to-cart" style="padding: 15px 25px;" onclick="addToCart(${typeof product.id==='string'?`'${product.id}'`:product.id})">Add to Cart</button>
                <button class="wishlist-btn" style="padding: 15px 25px; margin-left: 10px;" onclick="addToWishlist(${typeof product.id==='string'?`'${product.id}'`:product.id})">Add to Wishlist</button>
            </div>
        </div>`;
  if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(modalBody);
  modal.classList.add('show');
}

function closeModal() { const modal = document.getElementById('productModal'); if (modal) modal.classList.remove('show'); }

// ===== Cart and Wishlist (localStorage integration) =====
function addToCart(productId) {
  const live = getLiveProducts();
  const p = live.find(x=> String(x.id)===String(productId));
  if (!p){ showToast('Item not available.'); return; }
  const cart = getCart();
  const ex = cart.find(i=> String(i.id)===String(p.id));
  if (ex) ex.qty = (Number(ex.qty)||1) + 1; else cart.push({ id:p.id, qty:1, price:p.price, title:p.title });
  setCart(cart);
  showToast(`Added ${p.title} to cart!`);
}

function addToWishlist(productId) {
  const list = getWishlistLS();
  const idx = list.indexOf(productId);
  if (idx<0) list.push(productId);
  setWishlistLS(list);
  showToast('Added to wishlist!');
}

// ===== Toast notifications =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 12px 20px; border-radius: 8px; box-shadow: var(--shadow); z-index: 10000; animation: slideUp 0.3s ease;`;
  toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000);
}

// ===== Accessibility settings =====
function setupAccessibility() {
  const preferences = getUserPreferences();
  if (preferences.highContrast) document.body.classList.add('high-contrast');
  if (preferences.largeText) document.body.classList.add('large-text');
  if (window.AIDIFY_ACCESSIBILITY && window.AIDIFY_ACCESSIBILITY.applyAccessibility){ window.AIDIFY_ACCESSIBILITY.applyAccessibility(); }
}

function getUserPreferences() {
  return JSON.parse(localStorage.getItem('aidify_user_preferences')) || { location: navigator.language || 'en-US', browsingHistory: [], cartItems: [], wishlist: [] };
}
function saveUserPreferences(preferences) { localStorage.setItem('aidify_user_preferences', JSON.stringify(preferences)); }
function trackUserAction(action, productId) {
  const preferences = getUserPreferences();
  if (action === 'view') preferences.browsingHistory.push({ productId, timestamp: Date.now() });
  else if (action === 'add_to_cart') preferences.cartItems.push(productId);
  else if (action === 'add_to_wishlist') preferences.wishlist.push(productId);
  preferences.browsingHistory = preferences.browsingHistory.slice(-50);
  preferences.cartItems = preferences.cartItems.slice(-20);
  preferences.wishlist = preferences.wishlist.slice(-20);
  saveUserPreferences(preferences);
}
function loadUserPreferences() {
  const preferences = getUserPreferences();
  if (preferences.highContrast) document.body.classList.add('high-contrast');
  if (preferences.largeText) document.body.classList.add('large-text');
}

// ===== Accessibility Widget Logic =====
function setupAccessibilityWidget() {
  const widgetBtn = document.querySelector('.accessibility-toggle');
  const panel = document.getElementById('accessibilityPanel');
  if (!widgetBtn || !panel) return;
  widgetBtn.addEventListener('click', (e) => { e.stopPropagation(); const isHidden = panel.hidden; panel.hidden = !isHidden; panel.classList.toggle('show', !isHidden); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== widgetBtn) { panel.hidden = true; panel.classList.remove('show'); } });
  const syncSettings = () => { if(!window.AIDIFY_ACCESSIBILITY) return; const s = window.AIDIFY_ACCESSIBILITY.getSettings(); document.getElementById('highContrast').checked = s.contrast === 'high'; document.getElementById('largeText').checked = s.fontScale > 100; document.getElementById('reduceMotion').checked = s.reducedMotion; document.getElementById('darkMode').checked = s.theme === 'dark'; };
  syncSettings();
  document.getElementById('highContrast')?.addEventListener('change', function(){ window.AIDIFY_ACCESSIBILITY.updateSetting('contrast', this.checked ? 'high' : 'normal'); syncSettings(); });
  document.getElementById('largeText')?.addEventListener('change', function(){ window.AIDIFY_ACCESSIBILITY.updateSetting('fontScale', this.checked ? 125 : 100); syncSettings(); });
  document.getElementById('reduceMotion')?.addEventListener('change', function(){ window.AIDIFY_ACCESSIBILITY.updateSetting('reducedMotion', this.checked); syncSettings(); });
  document.getElementById('darkMode')?.addEventListener('change', function(){ window.AIDIFY_ACCESSIBILITY.updateSetting('theme', this.checked ? 'dark' : 'light'); syncSettings(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !panel.hidden){ panel.hidden=true; panel.classList.remove('show'); } });
  panel.addEventListener('click', (e)=> e.stopPropagation());
}

function updateUserPreference(key, value) { const preferences = getUserPreferences(); preferences[key] = value; saveUserPreferences(preferences); }

// ===== Navigation helpers =====
function navigateTo(page) { window.location.href = page; }
function startShopping() { document.querySelector('.top-products')?.scrollIntoView({ behavior: 'smooth' }); }
function exploreFeatures() { document.querySelector('.quick-access')?.scrollIntoView({ behavior: 'smooth' }); }

// ===== Event Listeners =====
function setupEventListeners() {
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('productModal')?.addEventListener('click', function(e){ if (e.target === this) closeModal(); });
  document.getElementById('newsletterForm')?.addEventListener('submit', function(e){ e.preventDefault(); const email = document.getElementById('newsletterEmail').value; if (email) { showToast('Thanks for subscribing to our newsletter!'); this.reset(); } });
  document.querySelectorAll('.product-card').forEach(card => { card.addEventListener('mouseenter', function() { const productId = this.dataset.id; trackUserAction('view', productId); }); });
}

// ===== Animations =====
function initAnimations() {
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; } }); }, { threshold: 0.1 });
  document.querySelectorAll('section').forEach(section => { section.style.opacity = '0'; section.style.transform = 'translateY(20px)'; section.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; observer.observe(section); });
}

// ===== Hero Products Carousel (3 animated, clickable, reshuffle each loop) =====
function initHeroProductsCarousel(){
  const container = document.querySelector('.hero-visual .floating-elements');
  if (!container) return;
  injectHeroCarouselStyles();

  function numericId(x){ const n=Number(x); return isNaN(n)? null : n; }
  function pickProducts(){
    const live = getLiveProducts();
    let pool = live.filter(p=>{ const n=numericId(p.id); return n!==null && n>=21 && n<=400; });
    if (pool.length<3) pool = live.slice();
    // shuffle and take 3
    const arr = pool.slice(); for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr.slice(0,3).map(productToCardModel);
  }

  function render(){
    const items = pickProducts();
    container.innerHTML = '';
    items.forEach((p, idx)=>{
      const el = document.createElement('div');
      el.className = 'hero-float-item';
      el.style.setProperty('--i', String(idx));
      el.setAttribute('role','button');
      el.setAttribute('tabindex','0');
      el.setAttribute('aria-label', p.name);
      el.innerHTML = p.image 
        ? `<img src="${p.image}" alt="${p.name}"><div class="hero-caption">${p.name}</div>` 
        : `<div class="placeholder">${p.name}</div>`;
      el.addEventListener('click', ()=> showProductDetails(p.id));
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); showProductDetails(p.id);} });
      container.appendChild(el);
    });
    // listen for animation loop on first item and reshuffle
    const first = container.querySelector('.hero-float-item');
    if (first){
      first.addEventListener('animationiteration', ()=>{
        // slight delay to avoid layout thrash
        setTimeout(render, 50);
      }, { once: true });
    }
  }

  render();
}

function injectHeroCarouselStyles(){
  if (document.getElementById('hero-carousel-styles')) return;
  const s = document.createElement('style'); s.id='hero-carousel-styles';
  s.textContent = `
    /* Keep hero visuals within a fixed band so they never overlap Featured Products */
    .hero-visual{ position:relative; height: 240px; max-height:240px; overflow:hidden; perspective: 900px; background: linear-gradient(180deg, transparent, rgba(0,0,0,.02)); }
    .hero-visual .floating-elements{ display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:nowrap; }

    .hero-float-item{ position:relative; border-radius:16px; overflow:hidden; box-shadow: 0 14px 32px rgba(0,0,0,.10); border:1px solid var(--border); cursor:pointer;
      animation: heroFloat 9s ease-in-out infinite alternate, heroTilt 8s ease-in-out infinite alternate;
      animation-delay: calc(var(--i) * .35s), calc(var(--i) * .5s);
      transform-origin:center; backdrop-filter: saturate(110%);
    }

    /* Varied sizes (constrained to the 240px band) */
    .hero-float-item:nth-child(1){ width: 300px; height: 180px; z-index:3; }
    .hero-float-item:nth-child(2){ width: 220px; height: 160px; z-index:2; }
    .hero-float-item:nth-child(3){ width: 220px; height: 200px; z-index:1; }

    .hero-float-item img{ width:100%; height:100%; object-fit:cover; display:block; transition: transform .45s ease; }
    .hero-float-item .hero-caption{ position:absolute; left:0; right:0; bottom:0; padding:8px 10px; color:#fff; font-weight:700; font-size:.9rem;
      background: linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,0)); text-shadow: 0 1px 2px rgba(0,0,0,.5); pointer-events:none; }

    .hero-float-item:hover{ transform: translateY(-4px) scale(1.02); box-shadow: 0 18px 40px rgba(0,0,0,.14); }
    .hero-float-item:hover img{ transform: scale(1.04); }
    .hero-float-item:focus{ outline:3px solid var(--accent); outline-offset:2px; }

    @keyframes heroFloat{ 0%{ transform: translate3d(0,0,0) rotateX(0deg); } 50%{ transform: translate3d(0,-6px,0) rotateX(2deg);} 100%{ transform: translate3d(0,0,0) rotateX(0deg);} }
    @keyframes heroTilt{ 0%{ transform: rotateZ(0deg);} 50%{ transform: rotateZ(1deg);} 100%{ transform: rotateZ(0deg);} }

    /* Responsive: keep visuals within band and no wrap overlap */
    @media (max-width: 1024px){
      .hero-visual{ height:220px; max-height:220px; }
      .hero-float-item:nth-child(1){ width: 40vw; height: 28vw; }
      .hero-float-item:nth-child(2){ width: 32vw; height: 24vw; }
      .hero-float-item:nth-child(3){ width: 32vw; height: 30vw; }
    }
    @media (max-width: 640px){
      .hero-visual{ height:200px; max-height:200px; }
      .hero-visual .floating-elements{ gap:10px; }
      .hero-float-item:nth-child(1){ width: 44vw; height: 30vw; }
      .hero-float-item:nth-child(2){ width: 36vw; height: 26vw; }
      .hero-float-item:nth-child(3){ width: 36vw; height: 32vw; }
    }
  `;
  document.head.appendChild(s);
}

// Legacy samples (kept as fallback only)
const sampleProducts = [];
const newArrivals = [];
