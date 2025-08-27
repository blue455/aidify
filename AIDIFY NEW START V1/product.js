// Product page logic for AIDIFY
(function(){
  // Global cache of products fetched from backend
  let __productsCache = [];
  // ===== DOM helpers =====
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }
  function norm(s){ return (s||'').toString().toLowerCase(); }
  function escapeRe(s){ return (s||'').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function getUserCountry(){
    try{ const auth = JSON.parse(localStorage.getItem('aidify.auth')||'null'); return auth && auth.country; }catch(e){ return null; }
  }
  function mapCountryToCurrency(country){
    if (!country) return 'USD';
    const c = country.toLowerCase();
    if (c.includes('cameroon')) return 'XAF';
    if (c.includes('nigeria')) return 'NGN';
    if (c.includes('ghana')) return 'GHS';
    if (c.includes('south africa')) return 'ZAR';
    if (c.includes('united kingdom') || c.includes('uk')) return 'GBP';
    if (c.includes('united states') || c.includes('usa')) return 'USD';
    if (c.includes('france') || c.includes('germany') || c.includes('italy') || c.includes('spain') || c.includes('netherlands')) return 'EUR';
    return 'USD';
  }
  const FX_RATES = { USD:1, XAF:600, XOF:600, NGN:1500, GHS:16, ZAR:18.5, EUR:0.92, GBP:0.78 };
  function currency(n){
    const code = mapCountryToCurrency(getUserCountry());
    const rate = FX_RATES[code] || 1;
    const amount = Number(n||0) * rate;
    const maxFrac = (code==='XAF' || code==='XOF' || code==='NGN') ? 0 : 2;
    try {
      return new Intl.NumberFormat(undefined,{style:'currency',currency:code, maximumFractionDigits:maxFrac}).format(amount);
    } catch(e){
      return (amount.toFixed(maxFrac) + ' ' + code);
    }
  }
  function escapeHTML(s){ return (s || '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m])); }

  // ===== Accessibility + UX =====
  const accessibilityToggle = qs('#accessibility-toggle');
  const accessibilityPanel = qs('#accessibility-panel');
  const closePanel = qs('.close-panel');
  const overlay = qs('#overlay');
  const mobileMenuButton = qs('.mobile-menu-button');
  const navMenu = qs('.nav-menu');
  const fontSizeButtons = qsa('.font-size-btn');
  const highContrastToggle = qs('#high-contrast-toggle');
  const darkModeToggle = qs('#dark-mode-toggle');
  const dyslexiaToggle = qs('#dyslexia-toggle');
  const linkHighlightToggle = qs('#link-highlight-toggle');
  const largeCursorsToggle = qs('#large-cursors-toggle');
  const reduceMotionToggle = qs('#reduce-motion-toggle');
  const layoutSelect = qs('#layout-select');

  const ttsScopeSelect = qs('#tts-scope');
  const ttsAutoReadToggle = qs('#tts-auto-read');
  const ttsPlayButton = qs('#tts-play');
  const ttsPauseButton = qs('#tts-pause');
  const ttsStopButton = qs('#tts-stop');
  const resetSettingsButton = qs('#reset-settings');

  function toggleAccessibilityPanel() {
    if (!accessibilityPanel || !overlay) return;
    accessibilityPanel.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = accessibilityPanel.classList.contains('open') ? 'hidden' : '';
  }
  function toggleMobileMenu() { if (navMenu) navMenu.classList.toggle('open'); }
  function changeFontSize(size){
    document.documentElement.style.fontSize = size==='sm'?'14px': size==='base'?'16px': size==='lg'?'18px':'20px';
    fontSizeButtons.forEach(btn=> btn.classList.toggle('active', btn.dataset.size===size));
    localStorage.setItem('fontSize', size);
  }
  function toggleClassPref(el, cls, key){ document.body.classList.toggle(cls); localStorage.setItem(key, document.body.classList.contains(cls)); }
  function changeLayout(columns){
    // Update CSS variable that controls grid template
    let cols = String(columns);
    if (['1','2','3','4','5','6'].includes(cols)){
      const min = getComputedStyle(document.documentElement).getPropertyValue('--card-min').trim() || '220px';
      const template = `repeat(${cols}, minmax(${min}, 1fr))`;
      document.documentElement.style.setProperty('--grid-template-columns', template);
      localStorage.setItem('gridColumns', cols);
    }else{
      document.documentElement.style.setProperty('--grid-template-columns', 'repeat(auto-fit, minmax(var(--card-min), 1fr))');
      localStorage.setItem('gridColumns', 'auto');
    }
  }

  // ===== TTS =====
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let currentUtterance = null;
  function getTTSTextByScope(scope){ try{ if(scope==='selection'){ const sel=window.getSelection().toString(); return sel&&sel.trim().length?sel.trim():''; } if(scope==='page'){ return document.body?document.body.innerText:''; } const container=qs('main')||document.body; return container?container.innerText:''; }catch(e){ return ''; } }
  function ttsSpeakFromScope(){ if(!synth){ alert("Your browser doesn't support text-to-speech functionality."); return;} const scope=(ttsScopeSelect&&ttsScopeSelect.value)||localStorage.getItem('ttsScope')||'main'; const text=getTTSTextByScope(scope); if(!text||!text.trim()){ alert(scope==='selection'?'No text is selected to read.':'No readable content found.'); return;} synth.cancel(); currentUtterance=new SpeechSynthesisUtterance(text); currentUtterance.onend=()=>{ currentUtterance=null; }; synth.speak(currentUtterance);} 
  function ttsPauseResume(){ if(!synth) return; if(synth.paused){ synth.resume(); } else if(synth.speaking){ synth.pause(); } }
  function ttsStop(){ if(!synth) return; synth.cancel(); currentUtterance=null; }

  function resetSettings(){ changeFontSize('base');
    if (highContrastToggle) highContrastToggle.checked=false; if (darkModeToggle) darkModeToggle.checked=false; if (dyslexiaToggle) dyslexiaToggle.checked=false; if (linkHighlightToggle) linkHighlightToggle.checked=false; if (largeCursorsToggle) largeCursorsToggle.checked=false; if (reduceMotionToggle) reduceMotionToggle.checked=false; if(ttsAutoReadToggle)ttsAutoReadToggle.checked=false; if(ttsScopeSelect)ttsScopeSelect.value='main'; if (layoutSelect){ layoutSelect.value='auto'; changeLayout('auto'); }
    document.body.classList.remove('high-contrast','dark-mode','dyslexia-mode','link-highlight','large-cursors','reduce-motion'); ttsStop(); localStorage.clear(); alert('All settings have been reset to default.'); }

  function loadPreferences(){ const fs=localStorage.getItem('fontSize'); if(fs) changeFontSize(fs);
    if(localStorage.getItem('highContrast')==='true' && highContrastToggle){ highContrastToggle.checked=true; document.body.classList.add('high-contrast'); }
    if(localStorage.getItem('darkMode')==='true' && darkModeToggle){ darkModeToggle.checked=true; document.body.classList.add('dark-mode'); }
    if(localStorage.getItem('dyslexiaFont')==='true' && dyslexiaToggle){ dyslexiaToggle.checked=true; document.body.classList.add('dyslexia-mode'); }
    if(localStorage.getItem('linkHighlight')==='true' && linkHighlightToggle){ linkHighlightToggle.checked=true; document.body.classList.add('link-highlight'); }
    if(localStorage.getItem('largeCursors')==='true' && largeCursorsToggle){ largeCursorsToggle.checked=true; document.body.classList.add('large-cursors'); }
    if(localStorage.getItem('reduceMotion')==='true' && reduceMotionToggle){ reduceMotionToggle.checked=true; document.body.classList.add('reduce-motion'); }
    const savedGridColumns = localStorage.getItem('gridColumns'); if(savedGridColumns && layoutSelect){ layoutSelect.value = savedGridColumns; changeLayout(savedGridColumns); }
    const savedScope = localStorage.getItem('ttsScope'); if (savedScope && ttsScopeSelect) ttsScopeSelect.value = savedScope; const savedAutoRead = localStorage.getItem('ttsAutoRead')==='true'; if (ttsAutoReadToggle) ttsAutoReadToggle.checked = savedAutoRead; }

  // ===== Data helpers =====
  function getPublishedProducts(){ return __productsCache.filter(p=>p && p.status==='published'); }
  function getOrders(){ try{ return JSON.parse(localStorage.getItem('aidify.orders')||'[]'); }catch(e){ return []; } }
  // Likes helpers
  function getLikes(){ try{ return JSON.parse(localStorage.getItem('aidify.likes')||'[]'); }catch(e){ return []; } }
  function setLikes(arr){ localStorage.setItem('aidify.likes', JSON.stringify(arr)); }
  function isLiked(id){ const likes=getLikes(); return likes.includes(id); }
  function toggleLike(id, btn){
    const likes = getLikes();
    const idx = likes.indexOf(id);
    if (idx>=0) likes.splice(idx,1); else likes.push(id);
    setLikes(likes);
    if (btn){
      const icon = btn.querySelector('i');
      if (icon){
        const liked = likes.includes(id);
        icon.className = (liked? 'fas' : 'far') + ' fa-heart';
        icon.style.color = liked ? '#ff5a5f' : 'var(--muted)';
      }
    }
  }

  // ===== Grid rendering & search =====
  var PAGE_SIZE = 16;
  var _state = { query: '', page: 1, total: 0 };
  function cardProduct(p){ const img=(p.images&&p.images[0])?p.images[0]:''; const title=escapeHTML(p.title||'Untitled'); const desc=escapeHTML(p.description||''); const pid=escapeHTML(p.id||''); const liked=isLiked(p.id); return `
    <div class="product-card" data-id="${pid}" style="cursor:pointer; position:relative;">
      <div class="product-image">${img?`<img src="${img}" alt="${title}">`:`<i class=\"fas fa-image\" style=\"font-size: 3rem; color: var(--muted);\"></i>`}
        <button class="like-btn" aria-label="Like" data-like="${pid}" style="position:absolute; top:8px; right:8px; background: rgba(255,255,255,.9); border:1px solid var(--border); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
          <i class="${liked?'fas':'far'} fa-heart" style="color:${liked?'#ff5a5f':'var(--muted)'}"></i>
        </button>
      </div>
      <div class="product-info">
        <h3 class="product-title">${title}</h3>
        ${desc?`<p>${desc}</p>`:''}
        <p class="product-price">${currency(p.price)}</p>
      </div>
    </div>`; }

  function drawProducts(){
    const grid=qs('#productGrid'); const empty=qs('#emptyProducts'); if(!grid) return;
    let prods=getPublishedProducts();
    const q = (_state.query||'').trim();
    if (q){
      const ql = norm(q);
      const reWord = new RegExp('\\b'+escapeRe(ql));
      const scored = prods.map(p=>{
        const t = norm(p.title||'');
        const c = norm(p.category||'');
        let rank = Infinity;
        if (t.startsWith(ql)) rank = Math.min(rank, 0);
        if (c && c.startsWith(ql)) rank = Math.min(rank, 1);
        if (reWord.test(t)) rank = Math.min(rank, 2);
        if (c && reWord.test(c)) rank = Math.min(rank, 3);
        if (t.includes(ql)) rank = Math.min(rank, 4);
        if (c && c.includes(ql)) rank = Math.min(rank, 5);
        return { p, rank };
      }).filter(x=> Number.isFinite(x.rank));
      prods = scored.sort((a,b)=> a.rank===b.rank ? ((b.p.createdAt||0)-(a.p.createdAt||0)) : a.rank-b.rank).map(x=>x.p);
    } else {
      prods = prods.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    }

    _state.total = prods.length;
    const totalPages = Math.max(1, Math.ceil(_state.total / PAGE_SIZE));
    if (_state.page > totalPages) _state.page = totalPages;
    const start = (_state.page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = prods.slice(start, end);

    if(!pageItems.length){ grid.innerHTML=''; if(empty) empty.style.display='block'; renderPager(totalPages); return; }
    if(empty) empty.style.display='none';
    grid.innerHTML = pageItems.map(cardProduct).join('');
    renderPager(totalPages);
  }

  function renderPager(totalPages){
    const grid=qs('#productGrid'); if(!grid) return;
    let pager = qs('#productPager');
    if (!pager){
      pager = document.createElement('div');
      pager.id = 'productPager';
      pager.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:8px; padding:8px 12px; border:1px solid var(--border); border-radius:8px; background: var(--surface); width:max-content; margin:12px auto;';
      grid.insertAdjacentElement('afterend', pager);
    }
    if (_state.total <= PAGE_SIZE){ pager.innerHTML = ''; return; }
    const from = (_state.page-1)*PAGE_SIZE + 1;
    const to = Math.min(_state.page*PAGE_SIZE, _state.total);

    pager.innerHTML = ''+
      '<button id="pgPrev" aria-label="Previous" style="padding:6px 10px; border:1px solid var(--border); border-radius:8px; background: var(--surface); cursor:pointer;'+(_state.page<=1?' opacity:.5; cursor:default;':'')+'">Prev</button>'+
      '<span style="font-size:.95rem; color: var(--muted);">'+from+'–'+to+' of '+_state.total+'</span>'+
      '<button id="pgNext" aria-label="Next" style="padding:6px 10px; border:1px solid var(--border); border-radius:8px; background: var(--surface); cursor:pointer;'+(_state.page>=totalPages?' opacity:.5; cursor:default;':'')+'">Next</button>';

    const prevBtn = qs('#pgPrev'); const nextBtn = qs('#pgNext');
    if (prevBtn) prevBtn.onclick = function(){ if (_state.page>1){ _state.page--; drawProducts(); window.scrollTo({top:0, behavior:'smooth'}); } };
    if (nextBtn) nextBtn.onclick = function(){ if (_state.page<totalPages){ _state.page++; drawProducts(); window.scrollTo({top:0, behavior:'smooth'}); } };
  }

  // ===== Product dialog =====
  const productDialog = qs('#productDialog');
  const dlgCloseBtn = qs('.close-dialog');
  const dlgRelatedGridEl = qs('#dlgRelatedGrid');

  function addToCart(p){
    try{
      const key='aidify.cart';
      const cart=JSON.parse(localStorage.getItem(key)||'[]');
      const ex=cart.find(i=>i.id===p.id);
      if(ex) ex.qty=(ex.qty||1)+1; else cart.push({id:p.id,qty:1,price:p.price,title:p.title});
      localStorage.setItem(key,JSON.stringify(cart));
      updateCartBadge();
      alert('Added to cart.');
    }catch(e){ alert('Could not add to cart.'); }
  }
  function toggleWishlist(productId, btn){ const key='aidify.wishlist'; const list=JSON.parse(localStorage.getItem(key)||'[]'); const idx=list.indexOf(productId); if(idx>=0){ list.splice(idx,1); btn.textContent='Add to wishlist'; } else { list.push(productId); btn.textContent='Remove from wishlist'; } localStorage.setItem(key, JSON.stringify(list)); updateWishlistBadge(); }
  function renderRelated(current){ const grid=qs('#dlgRelatedGrid'); const all=getPublishedProducts(); const rel=all.filter(x=>x.id!==current.id && x.category===current.category).slice(0,6); grid.innerHTML = rel.map(cardProduct).join('');
    // Enable swapping current product with a related one without closing
    if (grid){ grid.onclick = (e)=>{ const card=e.target.closest('.product-card'); if(!card) return; const id=card.getAttribute('data-id'); if(!id) return; openProductDialog(id); }; }
  }
  function openProductDialog(id){ const all=getPublishedProducts(); const p=all.find(x=>x.id===id); if(!p) return; const main=qs('#dlgMainImg'); const thumbs=qs('#dlgThumbs'); const titleEl=qs('#dlgTitle'); const priceEl=qs('#dlgPrice'); const catEl=qs('#dlgCategory'); const metaEl=qs('#dlgMeta'); const tagsEl=qs('#dlgTags'); const descEl=qs('#dlgDesc'); const specsEl=qs('#dlgSpecs');
    main.src=(p.images&&p.images[0])||''; main.alt=p.title||'';
    thumbs.innerHTML=''; (p.images||[]).forEach((src,i)=>{ const t=document.createElement('img'); t.src=src; t.alt=`thumbnail ${i+1}`; t.style.cursor='pointer'; t.addEventListener('click',()=> main.src=src); thumbs.appendChild(t); });
    titleEl.textContent=p.title||'Untitled'; const priceLabel=(p.priceCompare&&p.priceCompare>p.price)?`${currency(p.price)} <s style="color:var(--muted)">${currency(p.priceCompare)}</s>`:currency(p.price); priceEl.innerHTML=priceLabel; catEl.textContent=p.category||'General';
    const metaParts=[]; if(p.brand) metaParts.push(`Brand: ${escapeHTML(p.brand)}`); if(p.condition) metaParts.push(`Condition: ${escapeHTML(p.condition)}`); if(p.sku) metaParts.push(`SKU: ${escapeHTML(p.sku)}`); if(p.stock) metaParts.push(`In stock: ${String(p.stock)}`); if(p.weight) metaParts.push(`Weight: ${String(p.weight)} kg`); const dims=[p.length,p.width,p.height].filter(Boolean); if(dims.length) metaParts.push(`Dimensions: ${[p.length,p.width,p.height].filter(Boolean).join(' × ')} cm`); metaEl.innerHTML=metaParts.join(' · ');
    tagsEl.innerHTML=(p.tags&&p.tags.length)?p.tags.map(t=>`<span class="tag-chip">#${escapeHTML(t)}</span>`).join(' '):''; descEl.textContent=p.description||''; specsEl.innerHTML=''; if(p.specs&&p.specs.length){ const ul=document.createElement('ul'); ul.style.paddingLeft='18px'; p.specs.forEach(s=>{ const li=document.createElement('li'); li.textContent=`${s.key}: ${s.value}`; ul.appendChild(li); }); specsEl.appendChild(ul); }
    const addBtn=qs('#dlgAddCart'); const buyBtn=qs('#dlgBuyNow'); const wishBtn=qs('#dlgWishlist'); addBtn.onclick=()=>addToCart(p); buyBtn.onclick=()=>{ addToCart(p); alert('Proceeding to checkout...'); }; const wish=JSON.parse(localStorage.getItem('aidify.wishlist')||'[]'); wishBtn.textContent=(wish.includes(p.id)?'Remove from wishlist':'Add to wishlist'); wishBtn.onclick=()=>toggleWishlist(p.id,wishBtn);

    // Message seller form (aligned with seller inbox schema)
    const msgForm = qs('#msgSellerForm');
    const buyerNameEl = qs('#buyerName');
    const buyerMsgEl = qs('#buyerMsg');
    if (msgForm){
      msgForm.onsubmit = (e)=>{
        e.preventDefault();
        const from = (buyerNameEl && buyerNameEl.value.trim()) || 'Buyer';
        const body = (buyerMsgEl && buyerMsgEl.value.trim()) || '';
        if (!body){ alert('Please write a message.'); return; }
        const key = 'aidify.messages';
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        msgs.push({ id: Math.random().toString(36).slice(2,10), productId: p.id, from, body, time: Date.now() });
        localStorage.setItem(key, JSON.stringify(msgs));
        if (buyerMsgEl) buyerMsgEl.value = '';
        alert('Message sent to seller.');
      };
    }
    renderRelated(p); productDialog.showModal(); }

  // ===== Bindings =====
  function bindGlobalEvents(){
    if(accessibilityToggle) accessibilityToggle.addEventListener('click', toggleAccessibilityPanel);
    if(closePanel) closePanel.addEventListener('click', toggleAccessibilityPanel);
    if(overlay) overlay.addEventListener('click', toggleAccessibilityPanel);
    if(mobileMenuButton) mobileMenuButton.addEventListener('click', toggleMobileMenu);
    fontSizeButtons.forEach(btn=> btn.dataset.size && btn.addEventListener('click', ()=> changeFontSize(btn.dataset.size)));
    if(highContrastToggle) highContrastToggle.addEventListener('change', ()=> toggleClassPref(highContrastToggle,'high-contrast','highContrast'));
    if(darkModeToggle) darkModeToggle.addEventListener('change', ()=> toggleClassPref(darkModeToggle,'dark-mode','darkMode'));
    if(dyslexiaToggle) dyslexiaToggle.addEventListener('change', ()=> toggleClassPref(dyslexiaToggle,'dyslexia-mode','dyslexiaFont'));
    if(linkHighlightToggle) linkHighlightToggle.addEventListener('change', ()=> toggleClassPref(linkHighlightToggle,'link-highlight','linkHighlight'));
    if(largeCursorsToggle) largeCursorsToggle.addEventListener('change', ()=> toggleClassPref(largeCursorsToggle,'large-cursors','largeCursors'));
    if(reduceMotionToggle) reduceMotionToggle.addEventListener('change', ()=> toggleClassPref(reduceMotionToggle,'reduce-motion','reduceMotion'));
    if(layoutSelect) layoutSelect.addEventListener('change', ()=> changeLayout(layoutSelect.value));
    if(ttsScopeSelect) ttsScopeSelect.addEventListener('change', ()=> localStorage.setItem('ttsScope', ttsScopeSelect.value));
    if(ttsAutoReadToggle) ttsAutoReadToggle.addEventListener('change', ()=> localStorage.setItem('ttsAutoRead', ttsAutoReadToggle.checked));
    if(ttsPlayButton) ttsPlayButton.addEventListener('click', ttsSpeakFromScope);
    if(ttsPauseButton) ttsPauseButton.addEventListener('click', ttsPauseResume);
    if(ttsStopButton) ttsStopButton.addEventListener('click', ttsStop);
    if(resetSettingsButton) resetSettingsButton.addEventListener('click', resetSettings);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && accessibilityPanel && accessibilityPanel.classList.contains('open')){ toggleAccessibilityPanel(); }});

    const gridEl=qs('#productGrid'); if(gridEl){ gridEl.addEventListener('click', (e)=>{
      const like = e.target.closest('.like-btn');
      if (like){ e.preventDefault(); e.stopPropagation(); const id=like.getAttribute('data-like'); if(id) toggleLike(id, like); return; }
      const card=e.target.closest('.product-card'); if(!card) return; const id=card.getAttribute('data-id'); if(id) openProductDialog(id);
    }); }
    if(dlgRelatedGridEl){ dlgRelatedGridEl.addEventListener('click', (e)=>{ const card=e.target.closest('.product-card'); if(!card) return; const id=card.getAttribute('data-id'); if(id) openProductDialog(id); }); }
    const dlgCloseBtnEl=qs('.close-dialog'); if(dlgCloseBtnEl) dlgCloseBtnEl.addEventListener('click', ()=> qs('#productDialog').close());
    if(productDialog){ productDialog.addEventListener('click', (e)=>{ const content=qs('.product-dialog-content'); const r=content.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){ productDialog.close(); } }); }

    // Search bindings
    const searchForm = qs('.search-form');
    const searchInput = qs('.search-input');
    if (searchForm && searchInput){
      searchForm.addEventListener('submit', (e)=>{ e.preventDefault(); _state.query = searchInput.value.trim(); _state.page = 1; drawProducts(); });
      searchInput.addEventListener('input', ()=> { _state.query = searchInput.value.trim(); _state.page = 1; drawProducts(); });
    }
  }

  // ===== Badges =====
  function updateWishlistBadge(){ const badge = qs('#wishlistBadge'); if(!badge) return; try{ const list=JSON.parse(localStorage.getItem('aidify.wishlist')||'[]'); badge.textContent = String(list.length); } catch(e){ badge.textContent='0'; } }
  function updateCartBadge(){ const badge = qs('#cartBadge'); if(!badge) return; try{ const cart = JSON.parse(localStorage.getItem('aidify.cart')||'[]'); const totalQty = cart.reduce((sum,i)=> sum + (Number(i.qty)||0), 0); badge.textContent = String(totalQty); }catch(e){ badge.textContent='0'; } }
  window.addEventListener('storage', (e)=>{ if(e.key==='aidify.wishlist') updateWishlistBadge(); if(e.key==='aidify.cart') updateCartBadge(); });

  // ===== Secondary News Bar =====
  function injectNewsStyles(){
    const css = `
      .news-bar{ position:relative; background: var(--surface); box-shadow: var(--shadow); overflow:hidden; display:flex; align-items:center; }
      .news-grid{ display:grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap:12px; width:100%; padding:10px 16px; align-items:stretch; }
      .news-card{ display:flex; align-items:center; gap:8px; border:1px solid var(--border); background: var(--bg-soft); border-radius:12px; padding:8px 10px; min-height:48px; transform-origin:center; animation: spinIn .5s ease; }
      .news-card .mini{ width:36px; height:36px; border-radius:8px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid var(--border); }
      .news-card .mini img{ width:100%; height:100%; object-fit:cover; animation: pulse 2s ease-in-out infinite; }
      .news-card .text{ font-size: 0.92rem; line-height:1.2; }
      .news-card .text .title{ font-weight:700; }
      .news-card.spin{ animation: spinY .6s ease; }
      .news-bar::after{ content:""; position:absolute; left:-30%; bottom:-30%; width:3px; height:200%; background: linear-gradient( to right, transparent, rgba(255,255,255,.9), transparent ); transform: rotate(45deg); animation: diagSweep 4s linear infinite; filter: brightness(1.2); }
      @keyframes pulse{ 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.03); } }
      @keyframes spinIn{ from{ opacity:0; transform: rotateX(25deg) translateY(6px);} to{ opacity:1; transform: none; } }
      @keyframes spinY{ from{ transform: rotateY(0deg);} to{ transform: rotateY(360deg);} }
      @keyframes diagSweep{ 0%{ transform: translate(-20%,20%) rotate(45deg);} 100%{ transform: translate(140%,-140%) rotate(45deg);} }
      @media (max-width: 992px){ .news-grid{ grid-template-columns: repeat(3, 1fr);} }
      @media (max-width: 600px){ .news-grid{ grid-template-columns: repeat(2, 1fr);} }
    `;
    const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  }
  function emojiForPay(m){ const k=(m||'').toLowerCase(); if(k==='card') return '<i class="fas fa-credit-card"></i>'; if(k==='mobile') return '<i class="fas fa-mobile-alt"></i>'; if(k==='cod') return '<i class="fas fa-money-bill"></i>'; return '<i class="fas fa-receipt"></i>'; }
  function buildNewsItems(){
    const pro = getPublishedProducts();
    const ord = getOrders();
    const items = [];
    // Newest products
    pro.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,3).forEach(p=>{
      items.push({ html: `<div class="news-card"><div class="mini">${p.images&&p.images[0]?`<img src="${p.images[0]}" alt="${escapeHTML(p.title||'')}"/>`:'<i class="fas fa-image" style="color:var(--muted);"></i>'}</div><div class="text"><div class="title">New product</div><div>${escapeHTML(p.title||'Untitled')}</div></div></div>` });
    });
    // Recent payment method
    const latest = ord.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
    if (latest && latest.paymentMethod){
      const pm = latest.paymentMethod;
      items.push({ html: `<div class="news-card"><div class="mini">${emojiForPay(pm)}</div><div class="text"><div class="title">Recent payment</div><div>${escapeHTML(pm.toUpperCase())}</div></div></div>` });
    }
    // Most used payment method
    if (ord.length){
      const freq = {}; ord.forEach(o=>{ if(!o.paymentMethod) return; const k=o.paymentMethod.toLowerCase(); freq[k]=(freq[k]||0)+1; });
      const top = Object.keys(freq).sort((a,b)=>freq[b]-freq[a])[0];
      if (top){ items.push({ html: `<div class="news-card"><div class="mini">${emojiForPay(top)}</div><div class="text"><div class="title">Popular method</div><div>${escapeHTML(top.toUpperCase())}</div></div></div>`}); }
    }
    // Low stock products (<20)
    pro.filter(p=> typeof p.stock==='number' && p.stock < 20).slice(0,3).forEach(p=>{
      items.push({ html: `<div class="news-card"><div class="mini">${p.images&&p.images[0]?`<img src="${p.images[0]}" alt="${escapeHTML(p.title||'')}"/>`:'<i class="fas fa-box-open" style="color:var(--muted);"></i>'}</div><div class="text"><div class="title">Low stock</div><div>${escapeHTML(p.title||'')} (${String(p.stock)} left)</div></div></div>` });
    });
    if (!items.length){ items.push({ html: `<div class="news-card"><div class="mini"><i class="fas fa-bullhorn"></i></div><div class="text"><div class="title">Welcome</div><div>Explore new products today</div></div></div>`}); }
    return items;
  }
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  function initNewsBar(){
    injectNewsStyles();
    const nav = qs('.nav-container'); if(!nav) return;
    const bar = document.createElement('section'); bar.className='news-bar';
    const grid = document.createElement('div'); grid.className='news-grid'; bar.appendChild(grid);
    nav.insertAdjacentElement('afterend', bar);
    function sizeBar(){ const h = nav.offsetHeight || 64; bar.style.height = h+"px"; }
    sizeBar(); window.addEventListener('resize', sizeBar);
    const items = buildNewsItems();
    function render(){
      const set = shuffle(items.slice()).slice(0,6);
      grid.innerHTML = set.map(x=> x.html).join('');
      [...grid.children].forEach(c=>{ c.classList.remove('spin'); void c.offsetWidth; c.classList.add('spin'); });
    }
    render();
    setInterval(render, 6000);
  }

  async function loadProducts(){
    try{
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data && data.success) {
        __productsCache = Array.isArray(data.products) ? data.products : [];
        drawProducts();
      }
    }catch(err){ console.error('Failed to load products', err); }
  }

  // ===== Boot =====
  function boot(){
    loadPreferences();
    // Apply search query from navbar if present
    try{ const q = localStorage.getItem('aidify.searchQuery'); if(q){ _state.query = q; localStorage.removeItem('aidify.searchQuery'); } }catch(e){}
    _state.page = 1; 
    loadProducts();
    initNewsBar();
    bindGlobalEvents();
    updateWishlistBadge();
    updateCartBadge();
    // Auto-open product if redirected with lastSelectedProduct
    try{
      const last = localStorage.getItem('aidify.lastSelectedProduct');
      if (last){
        localStorage.removeItem('aidify.lastSelectedProduct');
        const all = getPublishedProducts();
        const found = all.find(p=> String(p.id)===String(last));
        if (found){ setTimeout(()=> openProductDialog(found.id), 200); }
      }
    }catch(e){}
    if(localStorage.getItem('ttsAutoRead')==='true'){
      setTimeout(()=> ttsSpeakFromScope(), 300);
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
