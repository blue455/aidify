(function(){
  function qs(sel, root=document){ return root.querySelector(sel); }
  function escapeHTML(s){ return (s || '').toString().replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m])); }
  function getPublishedProducts(){ try{ const all=JSON.parse(localStorage.getItem('aidify.products'))||[]; return all.filter(p=>p&&p.status==='published'); }catch(e){ return []; } }

  function cardProduct(p){ const img=(p.images&&p.images[0])?p.images[0]:''; const title=escapeHTML(p.title||'Untitled'); return `
    <div class="product-card" data-id="${escapeHTML(p.id||'')}">
      <div class="product-image">${img?`<img src="${img}" alt="${title}">`:`<i class=\"fas fa-image\" style=\"font-size: 3rem; color: var(--muted);\"></i>`}</div>
      <div class="product-info">
        <h3 class="product-title">${title}</h3>
        <p class="product-price"><span data-price-usd="${Number(p.price||0)}"></span></p>
      </div>
    </div>`; }

  function groupByCategory(products){
    const map = new Map();
    for(const p of products){ const cat = (p.category||'Uncategorized').trim()||'Uncategorized'; if(!map.has(cat)) map.set(cat,[]); map.get(cat).push(p); }
    return map;
  }
  function slugify(s){ return (s||'').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function getDesiredCategoryFromHash(){ try{ const h=decodeURIComponent((location.hash||'').slice(1)); const m=h.match(/^category=(.+)$/i); return m? m[1].trim() : ''; }catch(e){ return ''; } }

  function render(){
    const cont = qs('#categoriesContainer'); const none = qs('#noProducts');
    const prods = getPublishedProducts();
    if(!prods.length){ if(none) none.style.display='block'; return; }
    const groups = groupByCategory(prods);

    // Filter or focus by desired category from hash
    const desired = (getDesiredCategoryFromHash()||'').toLowerCase();
    const entries = [...groups.entries()].sort((a,b)=> a[0].localeCompare(b[0]));
    const filtered = desired ? entries.filter(([cat])=> cat.toLowerCase()===desired) : entries;

    const sections = [];
    filtered.forEach(([cat, items])=>{
      const grid = items.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(cardProduct).join('');
      const id = 'cat-' + slugify(cat);
      sections.push(`
        <section class="category-section" id="${id}">
          <div class="section-header">
            <h2>${escapeHTML(cat)}</h2>
            <span class="muted">${items.length} item${items.length>1?'s':''}</span>
          </div>
          <div class="products-grid">${grid}</div>
        </section>
      `);
    });
    cont.innerHTML = sections.join('');
    if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(cont);

    // Scroll to category if present
    if (desired){ const el = qs('#cat-' + slugify(desired)); if(el){ setTimeout(()=> el.scrollIntoView({behavior:'smooth', block:'start'}), 100); } }

    // Clicking a card navigates to Product.html and opens dialog
    cont.addEventListener('click', (e)=>{
      const card = e.target.closest('.product-card'); if(!card) return;
      const id = card.getAttribute('data-id'); if(!id) return;
      localStorage.setItem('aidify.lastSelectedProduct', id);
      window.location.href = 'Product.html';
    });
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('hashchange', render);
})();
