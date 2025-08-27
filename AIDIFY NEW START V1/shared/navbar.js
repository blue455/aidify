// AIDIFY Shared Navbar Injector
(function(){
  if (window.AIDIFY_NAVBAR_INJECTED) return; // avoid double-injection
  window.AIDIFY_NAVBAR_INJECTED = true;

  // Global currency utility
  (function(){
    function getAuth(){ try{ return JSON.parse(localStorage.getItem('aidify.auth')||'null'); }catch(e){ return null; } }
    function getCountry(){ const a=getAuth(); return a && a.country || null; }
    function mapCountryToCurrency(country){
      if(!country) return 'USD';
      const c=String(country).toLowerCase();
      if(c.includes('cameroon')) return 'XAF';
      if(c.includes('nigeria')) return 'NGN';
      if(c.includes('ghana')) return 'GHS';
      if(c.includes('south africa')) return 'ZAR';
      if(c.includes('united kingdom')||c.includes('uk')) return 'GBP';
      if(c.includes('united states')||c.includes('usa')) return 'USD';
      if(c.includes('france')||c.includes('germany')||c.includes('italy')||c.includes('spain')||c.includes('netherlands')) return 'EUR';
      return 'USD';
    }
    const FX_RATES = { USD:1, XAF:600, XOF:600, NGN:1500, GHS:16, ZAR:18.5, EUR:0.92, GBP:0.78 };
    function code(){ return mapCountryToCurrency(getCountry()); }
    function rate(){ const c=code(); return FX_RATES[c]||1; }
    function formatUSD(n){
      const r=rate(); const c=code();
      const amount=Number(n||0)*r;
      const maxFrac=(c==='XAF'||c==='XOF'||c==='NGN')?0:2;
      try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:c, maximumFractionDigits:maxFrac}).format(amount);}catch(e){ return amount.toFixed(maxFrac)+' '+c; }
    }
    function apply(root){ const container = root || document;
      container.querySelectorAll('[data-price-usd]').forEach(el=>{
        const val = el.getAttribute('data-price-usd');
        if (val==null) return;
        const num = Number(val);
        if (Number.isNaN(num)) return;
        const s = formatUSD(num);
        if (el.textContent !== s) el.textContent = s;
      });
    }
    window.AIDIFY_CURRENCY = { getCountry, code, rate, formatUSD, apply };
    if (document && document.body){
      const run = ()=> apply(document);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
      let scheduled = false;
      function schedule(){ if (scheduled) return; scheduled = true; setTimeout(()=>{ try{ apply(document); } finally { scheduled = false; } }, 200); }
      const mo = new MutationObserver((muts)=>{ for(const m of muts){ if(m.type==='childList'){ schedule(); break; } } });
      mo.observe(document.body, { childList:true, subtree:true });
      window.addEventListener('storage', (e)=>{ if (e.key==='aidify.auth') schedule(); });
    }
  })();

  function h(html){ const t=document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function byId(id){ return document.getElementById(id); }

  function updateWishlistBadge(){ const el=document.getElementById('wishlistBadge'); if(!el) return; try{ const list=JSON.parse(localStorage.getItem('aidify.wishlist')||'[]'); el.textContent=String(list.length);}catch(e){ el.textContent='0'; } }
  function updateCartBadge(){ const el=document.getElementById('cartBadge'); if(!el) return; try{ const cart=JSON.parse(localStorage.getItem('aidify.cart')||'[]'); const total=cart.reduce((s,i)=> s + (Number(i.qty)||0),0); el.textContent=String(total);}catch(e){ el.textContent='0'; } }

  function bindNavbar(nav){
    const mobileBtn = nav.querySelector('.mobile-menu-button');
    const menu = nav.querySelector('.nav-menu');
    if (mobileBtn && menu){ mobileBtn.addEventListener('click', ()=> menu.classList.toggle('open')); }

    // Accessibility panel toggle
    const accBtn = nav.querySelector('#accessibility-toggle');
    const panel = document.getElementById('accessibility-panel');
    const overlay = document.getElementById('overlay');
    const closePanel = document.querySelector('.close-panel');
    function toggleAcc(){ if(!panel || !overlay) return; panel.classList.toggle('open'); overlay.classList.toggle('active'); document.body.style.overflow = panel.classList.contains('open') ? 'hidden' : ''; }
    if (accBtn) accBtn.addEventListener('click', toggleAcc);
    if (closePanel) closePanel.addEventListener('click', toggleAcc);
    if (overlay) overlay.addEventListener('click', toggleAcc);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && panel && panel.classList.contains('open')) toggleAcc(); });

    // Wire a11y controls to shared manager
    wireA11yControls();

    // Search: redirect to Product.html carrying the query
    const searchForm = nav.querySelector('.search-form');
    const searchInput = nav.querySelector('.search-input');
    if (searchForm && searchInput){
      searchForm.addEventListener('submit', function(e){
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        try{ localStorage.setItem('aidify.searchQuery', q); }catch(err){}
        if (location.pathname.toLowerCase().includes('product.html')){
          // On product page, just reload state to let product.js pick it up
          location.reload();
        } else {
          window.location.href = 'Product.html';
        }
      });
    }

    // Language menu ARIA enhancements for dynamically injected menu
    enhanceLangMenu(nav);

    // Badges init
    updateWishlistBadge();
    updateCartBadge();
    window.addEventListener('storage', (e)=>{ if(e.key==='aidify.wishlist') updateWishlistBadge(); if(e.key==='aidify.cart') updateCartBadge(); });
  }

  function enhanceLangMenu(nav){
    const btn = nav.querySelector('.lang-switch');
    const menu = btn && btn.nextElementSibling && btn.nextElementSibling.classList.contains('lang-menu') ? btn.nextElementSibling : null;
    if (!btn || !menu) return;
    if (!menu.id){ menu.id = 'langMenu_' + Math.random().toString(36).slice(2,8); btn.setAttribute('aria-controls', menu.id); }
    menu.setAttribute('role','menu');
    menu.querySelectorAll('[data-lang]').forEach(item=>{ item.setAttribute('role','menuitem'); item.setAttribute('tabindex','-1'); });
    // Badge reflects stored language
    try{ const l = (window.AIDIFY_I18N && window.AIDIFY_I18N.getLang && window.AIDIFY_I18N.getLang()) || (localStorage.getItem('aidify.language')||'EN'); const badge=nav.querySelector('.lang-badge'); if(badge) badge.textContent=l; }catch(e){}
  }

  function wireA11yControls(){
    if (window.AIDIFY_NAVBAR_A11Y_BOUND) return; // bind once
    window.AIDIFY_NAVBAR_A11Y_BOUND = true;
    const M = window.AIDIFY_ACCESSIBILITY;
    if (!M || typeof M.updateSetting !== 'function') return;

    function byId(id){ return document.getElementById(id); }
    function onClickAll(sel, handler){ document.querySelectorAll(sel).forEach(el=> el.addEventListener('click', handler)); }

    // Font size buttons
    onClickAll('.font-size-btn', function(){ const size=this.getAttribute('data-size'); if(!size) return; M.updateSetting('fontSize', size); document.querySelectorAll('.font-size-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-size')===size)); });
    // Toggles
    const map = [
      ['high-contrast-toggle','highContrast'],
      ['dark-mode-toggle','darkMode'],
      ['dyslexia-toggle','dyslexiaFont'],
      ['link-highlight-toggle','linkHighlight'],
      ['large-cursors-toggle','largeCursors'],
      ['reduce-motion-toggle','reduceMotion']
    ];
    map.forEach(([id,key])=>{ const el=byId(id); if(el) el.addEventListener('change', ()=> M.updateSetting(key, el.checked)); });

    // Layout and TTS
    const layout = byId('layout-select'); if(layout) layout.addEventListener('change', ()=> M.updateSetting('gridColumns', layout.value));
    const ttsScope = byId('tts-scope'); if(ttsScope) ttsScope.addEventListener('change', ()=> M.updateSetting('ttsScope', ttsScope.value));
    const ttsAuto = byId('tts-auto-read'); if(ttsAuto) ttsAuto.addEventListener('change', ()=> M.updateSetting('ttsAutoRead', ttsAuto.checked));
    const play = byId('tts-play'); if(play) play.addEventListener('click', ()=> M.tts && M.tts.speak && M.tts.speak());
    const pause = byId('tts-pause'); if(pause) pause.addEventListener('click', ()=> M.tts && M.tts.pauseResume && M.tts.pauseResume());
    const stop = byId('tts-stop'); if(stop) stop.addEventListener('click', ()=> M.tts && M.tts.stop && M.tts.stop());

    // Reset button
    const reset = byId('reset-settings');
    if (reset){
      reset.addEventListener('click', function(){
        try{ ['fontSize','highContrast','darkMode','dyslexiaFont','linkHighlight','largeCursors','reduceMotion','gridColumns','ttsScope','ttsAutoRead'].forEach(k=> localStorage.removeItem(k)); }catch(e){}
        M.applyAccessibility && M.applyAccessibility();
        // Reset UI states
        document.querySelectorAll('.font-size-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-size')==='base'));
        map.forEach(([id])=>{ const el=byId(id); if(el) el.checked=false; });
        if(layout) layout.value='4'; if(ttsScope) ttsScope.value='main'; if(ttsAuto) ttsAuto.checked=false;
        alert('Accessibility settings reset.');
      });
    }

    // Initialize from settings
    try{
      const s = M.getSettings && M.getSettings();
      if (s){
        document.querySelectorAll('.font-size-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-size')===s.fontSize));
        map.forEach(([id,key])=>{ const el=byId(id); if(el) el.checked = !!s[key]; });
        if(layout) layout.value = s.gridColumns==='auto' ? '4' : String(s.gridColumns);
        if(ttsScope) ttsScope.value = s.ttsScope || 'main';
        if(ttsAuto) ttsAuto.checked = !!s.ttsAutoRead;
      }
    }catch(e){}
  }

  function injectNavbarStyles(){
    if (document.getElementById('aidify-navbar-styles')) return;
    const s = document.createElement('style'); s.id = 'aidify-navbar-styles';
    s.textContent = `
      .nav-container{ position:sticky; top:0; z-index:1000; background: var(--surface); box-shadow: var(--shadow); border-bottom:1px solid var(--border); }
      .nav-wrapper{ max-width:1200px; margin:0 auto; padding: 0 16px; }
      .nav-main{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding: 10px 0; }
      .logo-area .logo-container{ display:flex; align-items:center; gap:10px; color: var(--text); text-decoration:none; }
      .logo-area .logo-text{ font-weight:900; letter-spacing:.3px; }
      .nav-search{ flex:1; max-width:440px; }
      .nav-search .search-form{ display:flex; width:100%; }
      .nav-search .search-input{ flex:1; padding:10px 12px; border:1px solid var(--border); border-right:0; border-radius: 8px 0 0 8px; background:#fff; color: var(--text); }
      .nav-search .search-button{ padding:10px 12px; border:1px solid var(--border); border-radius: 0 8px 8px 0; background: var(--primary); color:#fff; cursor:pointer; }
      .nav-menu{ display:flex; list-style:none; gap:18px; margin:0; padding:0; }
      .nav-link{ color: var(--text); text-decoration:none; position:relative; padding:6px 0; }
      .nav-link:after{ content:""; position:absolute; left:0; bottom:0; width:0; height:2px; background: var(--primary); transition: width .2s ease; }
      .nav-link:hover:after, .nav-link:focus:after{ width:100%; }
      .nav-actions{ display:flex; align-items:center; gap:10px; }
      .action-button{ background: none; border: none; color: var(--text); cursor:pointer; position:relative; padding:6px; border-radius:6px; }
      .action-button .badge{ position:absolute; top:-4px; right:-4px; min-width:18px; height:18px; border-radius:999px; background: var(--danger); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; }
      .accessibility-button{ background: var(--primary); color:#fff; border:0; border-radius:8px; padding:8px 12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; }
      .mobile-menu-button{ display:none; background:none; border:0; color: var(--text); font-size: 20px; padding:6px; }
      @media (max-width: 768px){
        .mobile-menu-button{ display:block; }
        .nav-main{ flex-wrap: wrap; }
        .nav-search{ order:3; width:100%; max-width:none; }
        .nav-menu{ display:none; flex-direction:column; width:100%; padding:8px 0; }
        .nav-menu.open{ display:flex; }
      }
      /* Accessibility panel + overlay (global) */
      .accessibility-panel{ position:fixed; top:0; right:-380px; width:380px; height:100vh; background: var(--surface, #ffffff); color: var(--text, #0f0f0f); box-shadow:-5px 0 15px rgba(0,0,0,0.1); z-index:1001; padding:16px 24px; overflow-y:auto; transition:right .3s ease; }
      .accessibility-panel.open{ right:0; }
      .panel-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border); }
      .panel-title{ font-size:1.125rem; font-weight:600; color:var(--text); }
      .panel-section{ margin-bottom:18px; }
      .panel-section-title{ font-size:1rem; margin-bottom:10px; color:var(--primary); font-weight:600; }
      .option-group{ display:flex; flex-direction:column; gap:10px; }
      .option-row{ display:flex; align-items:center; justify-content:space-between; }
      .option-label{ font-weight:500; min-width:120px; color:var(--text); }
      .layout-select{ padding:6px 8px; border:1px solid var(--border); border-radius:6px; background:var(--surface); color:var(--text); min-width:120px }
      .font-size-btn{ padding:6px 8px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; border-radius:6px; min-width:40px }
      .font-size-btn.active{ background:var(--primary); color:#fff; border-color:var(--primary) }
      .toggle-switch{ position:relative; display:inline-block; width:50px; height:24px }
      .toggle-switch input{ opacity:0; width:0; height:0 }
      .slider{ position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:var(--muted); transition:.4s; border-radius:24px }
      .slider:before{ position:absolute; content:""; height:16px; width:16px; left:4px; bottom:4px; background:var(--surface); transition:.4s; border-radius:50% }
      input:checked + .slider{ background:var(--primary) }
      input:checked + .slider:before{ transform:translateX(26px) }
      .overlay{ position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,.5); z-index:1000; opacity:0; visibility:hidden; transition: opacity .3s ease }
      .overlay.active{ opacity:1; visibility:visible }
      @media (max-width:768px){ .accessibility-panel{ width:100%; right:-100%; } }
    `;
    document.head.appendChild(s);
  }

  function ensureAccessibilityPanel(){
    if (document.getElementById('accessibility-panel')) return;
    const panel = h(`
      <div class="accessibility-panel" id="accessibility-panel">
        <div class="panel-header">
          <h2 class="panel-title">Accessibility Settings</h2>
          <button class="close-panel" aria-label="Close panel">✕</button>
        </div>
        <div class="panel-section">
          <h3 class="panel-section-title">Text & Font</h3>
          <div class="option-group">
            <div class="option-row">
              <span class="option-label">Font Size</span>
              <div class="option-controls">
                <button class="font-size-btn" data-size="sm">A-</button>
                <button class="font-size-btn active" data-size="base">A</button>
                <button class="font-size-btn" data-size="lg">A+</button>
                <button class="font-size-btn" data-size="xl">A++</button>
              </div>
            </div>
            <div class="option-row">
              <span class="option-label">Dyslexia Font</span>
              <label class="toggle-switch"><input type="checkbox" id="dyslexia-toggle"><span class="slider"></span></label>
            </div>
            <div class="option-row">
              <span class="option-label">Read Scope</span>
              <select class="layout-select" id="tts-scope"><option value="main">Main content</option><option value="page">Entire page</option><option value="selection">Selected text</option></select>
            </div>
            <div class="option-row">
              <span class="option-label">Auto-read on Load</span>
              <label class="toggle-switch"><input type="checkbox" id="tts-auto-read"><span class="slider"></span></label>
            </div>
            <div class="option-row">
              <span class="option-label">Text-to-Speech</span>
              <div class="option-controls">
                <button class="font-size-btn" id="tts-play" aria-label="Start reading">▶</button>
                <button class="font-size-btn" id="tts-pause" aria-label="Pause or resume">⏸</button>
                <button class="font-size-btn" id="tts-stop" aria-label="Stop reading">⏹</button>
              </div>
            </div>
          </div>
        </div>
        <div class="panel-section">
          <h3 class="panel-section-title">Color & Contrast</h3>
          <div class="option-group">
            <div class="option-row"><span class="option-label">High Contrast</span><label class="toggle-switch"><input type="checkbox" id="high-contrast-toggle"><span class="slider"></span></label></div>
            <div class="option-row"><span class="option-label">Dark Mode</span><label class="toggle-switch"><input type="checkbox" id="dark-mode-toggle"><span class="slider"></span></label></div>
            <div class="option-row"><span class="option-label">Link Highlighting</span><label class="toggle-switch"><input type="checkbox" id="link-highlight-toggle"><span class="slider"></span></label></div>
          </div>
        </div>
        <div class="panel-section">
          <h3 class="panel-section-title">Layout & Interaction</h3>
          <div class="option-group">
            <div class="option-row"><span class="option-label">Grid Layout</span><select class="layout-select" id="layout-select"><option value="4">4 Columns</option><option value="3">3 Columns</option><option value="2">2 Columns</option><option value="1">1 Column</option></select></div>
            <div class="option-row"><span class="option-label">Large Cursors</span><label class="toggle-switch"><input type="checkbox" id="large-cursors-toggle"><span class="slider"></span></label></div>
            <div class="option-row"><span class="option-label">Reduce Motion</span><label class="toggle-switch"><input type="checkbox" id="reduce-motion-toggle"><span class="slider"></span></label></div>
          </div>
        </div>
        <div class="panel-section"><button class="accessibility-button" id="reset-settings" style="width:100%">Reset to Default Settings</button></div>
      </div>
    `);
    const overlay = h('<div class="overlay" id="overlay"></div>');
    document.body.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function injectNavbar(){
    if (document.querySelector('.nav-container')) return; // already present on page
    injectNavbarStyles();
    ensureAccessibilityPanel();
    const nav = h(`
      <nav class="nav-container" aria-label="Main navigation">
        <div class="nav-wrapper">
          <div class="nav-main">
            <div class="logo-area">
              <a href="Home_page.html" class="logo-container" aria-label="Go to Home">
                <div class="logo-image"><img src="P&AEF_copy.png" alt="Platform logo" height="50"></div>
                <div class="logo-text">AIDIFY</div>
              </a>
            </div>
            <div class="nav-search">
              <form class="search-form" role="search">
                <input type="text" class="search-input" placeholder="Search products..." aria-label="Search products">
                <button type="submit" class="search-button" aria-label="Search"><i class="fas fa-search"></i></button>
              </form>
            </div>
            <button class="mobile-menu-button" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
            <ul class="nav-menu">
              <li><a href="Home_page.html" class="nav-link" data-i18n="nav.home">Home</a></li>
              <li><a href="Product.html" class="nav-link" data-i18n="nav.products">Products</a></li>
              <li><a href="Categories.html" class="nav-link" data-i18n="nav.categories">Categories</a></li>
            </ul>
            <div class="nav-actions" style="margin-left: var(--spacing-6);">
              <a href="ContactPage.html" class="action-button" aria-label="Contact support"><i class="fas fa-headset"></i></a>
              <button class="action-button lang-switch" aria-haspopup="true" aria-expanded="false" title="Language">
                <i class="fas fa-globe"></i>
                <span class="lang-badge" style="margin-left:4px; font-weight:700;">EN</span>
              </button>
              <div class="lang-menu" hidden style="position:absolute; right:140px; top:60px; background:#fff; border:1px solid var(--border); border-radius:8px; box-shadow: var(--shadow); padding:6px 0; min-width:120px; z-index:1000;">
                <button class="action-button" data-lang="EN" style="width:100%; justify-content:flex-start; padding:8px 12px;">EN — English</button>
                <button class="action-button" data-lang="FR" style="width:100%; justify-content:flex-start; padding:8px 12px;">FR — Français</button>
              </div>
              <a href="userprofile.html" class="action-button" aria-label="User profile"><i class="fas fa-user"></i></a>
              <a href="Wishlist.html" class="action-button" aria-label="Wishlist" id="wishlistAction"><i class="fas fa-heart"></i><span class="badge" id="wishlistBadge">0</span></a>
              <a href="Cart.html" class="action-button" aria-label="Shopping cart" id="cartAction"><i class="fas fa-shopping-cart"></i><span class="badge" id="cartBadge">0</span></a>
              <button class="accessibility-button" id="accessibility-toggle"><i class="fas fa-universal-access"></i><span data-i18n="nav.accessibility">Accessibility</span></button>
            </div>
          </div>
        </div>
      </nav>
    `);

    // Insert at top of body
    const first = document.body.firstElementChild;
    if (first) document.body.insertBefore(nav, first); else document.body.appendChild(nav);
    bindNavbar(nav);

    // Apply i18n if present
    if (window.AIDIFY_I18N && typeof window.AIDIFY_I18N.apply==='function'){
      window.AIDIFY_I18N.apply();
    }
    // Apply accessibility styles if present
    if (window.AIDIFY_ACCESSIBILITY && typeof window.AIDIFY_ACCESSIBILITY.applyAccessibility==='function'){
      window.AIDIFY_ACCESSIBILITY.applyAccessibility();
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }
})();
