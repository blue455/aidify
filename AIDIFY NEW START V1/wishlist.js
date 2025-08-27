(function(){
  function qs(s,r=document){ return r.querySelector(s); }
  function escapeHTML(s){ return (s||'').toString().replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m])); }
    function getProducts(){ try{ return JSON.parse(localStorage.getItem('aidify.products'))||[]; }catch(e){ return []; } }
  function getWishlist(){ try{ return JSON.parse(localStorage.getItem('aidify.wishlist'))||[]; }catch(e){ return []; } }
  function setWishlist(arr){ localStorage.setItem('aidify.wishlist', JSON.stringify(arr)); updateWishlistBadge(); }
  function addToCart(p){
    const key='aidify.cart';
    const cart=JSON.parse(localStorage.getItem(key)||'[]');
    const ex=cart.find(i=>i.id===p.id);
    if(ex) ex.qty=(ex.qty||1)+1; else cart.push({ id:p.id, qty:1, price:p.price, title:p.title });
    localStorage.setItem(key, JSON.stringify(cart));
    updateCartBadge();
    alert('Added to cart.');
  }

  function card(p){ const img=(p.images&&p.images[0])?p.images[0]:''; const title=escapeHTML(p.title||'Untitled'); return `
    <article class="product-card" data-id="${escapeHTML(p.id)}">
      <div class="product-image">${img?`<img src="${img}" alt="${title}">`:`<i class=\"fas fa-image\" style=\"font-size: 3rem; color: var(--muted);\"></i>`}</div>
      <div class="product-info">
        <div class="product-title">${title}</div>
        <div class="product-price"><span data-price-usd="${Number(p.price||0)}"></span></div>
        <div class="wish-actions">
          <button class="btn btn-primary" data-add-cart="${escapeHTML(p.id)}">Add to cart</button>
          <button class="btn btn-ghost" data-remove="${escapeHTML(p.id)}">Remove</button>
        </div>
      </div>
    </article>`; }

  function draw(){ const grid=qs('#wishlistGrid'); const empty=qs('#wishlistEmpty'); if(!grid) return; const all=getProducts(); const wish=getWishlist(); const items=wish.map(id=> all.find(p=>p.id===id)).filter(Boolean); updateCartBadge();
    if(!items.length){ grid.innerHTML=''; if(empty) empty.style.display='block'; return; }
    if(empty) empty.style.display='none';
    grid.innerHTML = items.map(card).join('');
    if (window.AIDIFY_CURRENCY) window.AIDIFY_CURRENCY.apply(grid);
  }

  function bind(){ const grid=qs('#wishlistGrid'); if(!grid) return; updateCartBadge(); updateWishlistBadge();
    grid.addEventListener('click',(e)=>{
      const rm = e.target.getAttribute('data-remove'); if(rm){ const list=getWishlist().filter(id=>id!==rm); setWishlist(list); draw(); return; }
      const add = e.target.getAttribute('data-add-cart'); if(add){ const p = getProducts().find(x=>x.id===add); if(p){ addToCart(p); } return; }
      const card = e.target.closest('.product-card'); if(card){ const id=card.getAttribute('data-id'); if(id){ localStorage.setItem('aidify.lastSelectedProduct', id); window.location.href='Product.html'; } }
    });
  }

  function updateCartBadge(){ const el=document.getElementById('cartBadge'); if(!el) return; try{ const cart=JSON.parse(localStorage.getItem('aidify.cart')||'[]'); const total=cart.reduce((s,i)=> s + (Number(i.qty)||0),0); el.textContent=String(total);}catch(e){ el.textContent='0'; } }
  function updateWishlistBadge(){ const el=document.getElementById('wishlistBadge'); if(!el) return; try{ const list=JSON.parse(localStorage.getItem('aidify.wishlist')||'[]'); el.textContent=String(list.length);}catch(e){ el.textContent='0'; } }
  window.addEventListener('storage', (e)=>{ if(e.key==='aidify.cart') updateCartBadge(); if(e.key==='aidify.wishlist') updateWishlistBadge(); });
  document.addEventListener('DOMContentLoaded', ()=>{ draw(); bind(); updateCartBadge(); updateWishlistBadge(); });
})();
