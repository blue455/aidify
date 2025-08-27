// AIDIFY simple i18n with EN/FR, persisted across pages
(function(){
  const STORAGE_KEY = 'aidify.language';
  const SUPPORTED = ['EN','FR'];
  const DICT = {
    EN: {
      'nav.home': 'Home',
      'nav.products': 'Products',
      'nav.categories': 'Categories',
      'nav.about': 'About',
      'nav.accessibility': 'Accessibility',
      'nav.contact': 'Contact',
      'nav.profile': 'Profile',
      'nav.cart': 'Cart',
      'nav.wishlist': 'Wishlist',

      'home.hero.title': 'Welcome to Your Personalized Shopping Experience',
      'home.hero.cta1': 'Start Shopping',
      'home.hero.cta2': 'Explore Features',
      'home.quick.cart.title': 'Your Cart',
      'home.quick.cart.desc': 'Manage your shopping items',
      'home.quick.orders.title': 'Order History',
      'home.quick.orders.desc': 'Track your purchases',
      'home.quick.account.title': 'Account Settings',
      'home.quick.account.desc': 'Update your preferences',
      'home.quick.chat.title': 'Support Chat',
      'home.quick.chat.desc': 'Get help instantly',

      'product.related': 'Related products',
      'product.message_seller': 'Message the seller',
      'product.message.name': 'Your name',
      'product.message.body': 'Write a message…',

      /* Footer: brand & trust */
      'footer.brand.about': 'About Aidify',
      'footer.brand.desc': 'Quality products curated with care. We aim to deliver value, style and a seamless shopping experience.',
      'footer.trust.secure': 'Secure checkout',
      'footer.trust.returns': '30‑day returns',
      'footer.trust.delivery': 'Fast delivery',

      /* Footer: newsletter */
      'footer.newsletter.title': 'Get 10% off your first order',
      'footer.newsletter.subtitle': 'Join our list for exclusive drops, news and deals.',
      'footer.newsletter.placeholder': 'Your email',
      'footer.newsletter.cta': 'Subscribe',
      'footer.newsletter.success': 'Thanks! You are subscribed.',
      'footer.newsletter.error': 'Please enter a valid email.',

      /* Footer columns */
      'footer.columns.shop': 'Shop',
      'footer.columns.help': 'Help',
      'footer.columns.company': 'Company',
      'footer.columns.legal': 'Legal',

      /* Footer links */
      'footer.links.newArrivals': 'New arrivals',
      'footer.links.bestSellers': 'Best sellers',
      'footer.links.electronics': 'Electronics',
      'footer.links.clothing': 'Clothing',
      'footer.links.accessories': 'Accessories',
      'footer.links.books': 'Books',
      'footer.links.giftCards': 'Gift cards',

      'footer.links.shipping': 'Shipping & delivery',
      'footer.links.returns': 'Returns & exchanges',
      'footer.links.faqs': 'FAQs',
      'footer.links.trackOrder': 'Track order',
      'footer.links.sizeGuide': 'Size guide',
      'footer.links.contact': 'Contact us',

      'footer.links.about': 'About',
      'footer.links.careers': 'Careers',
      'footer.links.blog': 'Blog',
      'footer.links.investors': 'Investor relations',
      'footer.links.sustainability': 'Sustainability',

      'footer.links.privacy': 'Privacy policy',
      'footer.links.terms': 'Terms of service',
      'footer.links.cookiePolicy': 'Cookie policy',
      'footer.links.cookieSettings': 'Cookie settings',

      /* Footer selects */
      'footer.selects.region': 'Region',
      'footer.selects.currency': 'Currency',
      'footer.selects.language': 'Language',

      /* Footer bottom */
      'footer.copyright': 'All rights reserved.'
    },
    FR: {
      'nav.home': 'Accueil',
      'nav.products': 'Produits',
      'nav.categories': 'Catégories',
      'nav.about': 'À propos',
      'nav.accessibility': 'Accessibilité',
      'nav.contact': 'Contact',
      'nav.profile': 'Profil',
      'nav.cart': 'Panier',
      'nav.wishlist': 'Favoris',

      'home.hero.title': 'Bienvenue dans votre expérience d\'achat personnalisée',
      'home.hero.cta1': 'Commencer vos achats',
      'home.hero.cta2': 'Découvrir les fonctionnalités',
      'home.quick.cart.title': 'Votre Panier',
      'home.quick.cart.desc': 'Gérez vos articles',
      'home.quick.orders.title': 'Historique des commandes',
      'home.quick.orders.desc': 'Suivez vos achats',
      'home.quick.account.title': 'Paramètres du compte',
      'home.quick.account.desc': 'Mettez à jour vos préférences',
      'home.quick.chat.title': 'Assistance en direct',
      'home.quick.chat.desc': 'Obtenez de l\'aide immédiatement',

      'product.related': 'Produits associés',
      'product.message_seller': 'Contacter le vendeur',
      'product.message.name': 'Votre nom',
      'product.message.body': 'Écrivez un message…',

      /* Footer: brand & trust */
      'footer.brand.about': 'À propos d\'Aidify',
      'footer.brand.desc': 'Des produits de qualité sélectionnés avec soin. Nous visons à offrir de la valeur, du style et une expérience d\'achat fluide.',
      'footer.trust.secure': 'Paiement sécurisé',
      'footer.trust.returns': 'Retours sous 30 jours',
      'footer.trust.delivery': 'Livraison rapide',

      /* Footer: newsletter */
      'footer.newsletter.title': 'Recevez 10% de réduction sur votre première commande',
      'footer.newsletter.subtitle': 'Inscrivez-vous pour des nouveautés, lancements et offres exclusives.',
      'footer.newsletter.placeholder': 'Votre e-mail',
      'footer.newsletter.cta': 'S\'abonner',
      'footer.newsletter.success': 'Merci ! Vous êtes abonné.',
      'footer.newsletter.error': 'Veuillez saisir un e-mail valide.',

      /* Footer columns */
      'footer.columns.shop': 'Boutique',
      'footer.columns.help': 'Aide',
      'footer.columns.company': 'Entreprise',
      'footer.columns.legal': 'Mentions légales',

      /* Footer links */
      'footer.links.newArrivals': 'Nouveautés',
      'footer.links.bestSellers': 'Meilleures ventes',
      'footer.links.electronics': 'Électronique',
      'footer.links.clothing': 'Vêtements',
      'footer.links.accessories': 'Accessoires',
      'footer.links.books': 'Livres',
      'footer.links.giftCards': 'Cartes cadeaux',

      'footer.links.shipping': 'Expédition & livraison',
      'footer.links.returns': 'Retours & échanges',
      'footer.links.faqs': 'FAQs',
      'footer.links.trackOrder': 'Suivre une commande',
      'footer.links.sizeGuide': 'Guide des tailles',
      'footer.links.contact': 'Nous contacter',

      'footer.links.about': 'À propos',
      'footer.links.careers': 'Carrières',
      'footer.links.blog': 'Blog',
      'footer.links.investors': 'Relations investisseurs',
      'footer.links.sustainability': 'Durabilité',

      'footer.links.privacy': 'Politique de confidentialité',
      'footer.links.terms': 'Conditions d\'utilisation',
      'footer.links.cookiePolicy': 'Politique relative aux cookies',
      'footer.links.cookieSettings': 'Paramètres des cookies',

      /* Footer selects */
      'footer.selects.region': 'Région',
      'footer.selects.currency': 'Devise',
      'footer.selects.language': 'Langue',

      /* Footer bottom */
      'footer.copyright': 'Tous droits réservés.'
    }
  };

  function getLang(){ const v = localStorage.getItem(STORAGE_KEY) || 'EN'; return SUPPORTED.includes(v) ? v : 'EN'; }
  function setLang(l){ if(!SUPPORTED.includes(l)) return; localStorage.setItem(STORAGE_KEY, l); applyI18N(); updateBadges(); updateDocLang(); document.dispatchEvent(new CustomEvent('aidify:lang', { detail:{ lang:l } })); }
  function t(key){ const l=getLang(); return (DICT[l] && DICT[l][key]) || (DICT.EN && DICT.EN[key]) || ''; }

  function applyI18N(root){ const R = root||document;
    R.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); const v=t(k); if(v) el.textContent = v; });
    R.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ const k=el.getAttribute('data-i18n-placeholder'); const v=t(k); if(v) el.setAttribute('placeholder', v); });
  }
  function updateBadges(){ const l=getLang(); document.querySelectorAll('.lang-badge').forEach(el=> el.textContent = l); }
  function updateDocLang(){ const l=getLang()==='FR'?'fr':'en'; try{ document.documentElement.setAttribute('lang', l); }catch(e){} }

  function closeAllMenus(){ document.querySelectorAll('.lang-menu').forEach(m=> m.setAttribute('hidden','')); document.querySelectorAll('.lang-switch[aria-expanded]')?.forEach(b=> b.setAttribute('aria-expanded','false')); }

  function focusFirstItem(menu){ const it = menu.querySelector('[data-lang]'); if(it){ it.focus(); } }
  function focusNextItem(menu, current, dir){ const items=[...menu.querySelectorAll('[data-lang]')]; const idx=Math.max(0, items.indexOf(current)); const next= items[(idx + (dir>0?1:items.length-1)) % items.length]; if(next) next.focus(); }

  function enhanceMenus(){
    document.querySelectorAll('.lang-menu').forEach(menu=>{
      menu.setAttribute('role','menu');
      menu.querySelectorAll('[data-lang]').forEach(btn=>{ btn.setAttribute('role','menuitem'); btn.setAttribute('tabindex','-1'); });
    });
    document.querySelectorAll('.lang-switch').forEach(btn=>{
      // attach menu id if missing
      const menu = btn.nextElementSibling && btn.nextElementSibling.classList.contains('lang-menu') ? btn.nextElementSibling : null;
      if(menu && !menu.id){ menu.id = 'langMenu_' + Math.random().toString(36).slice(2,8); btn.setAttribute('aria-controls', menu.id); }
    });
  }

  function bindSwitches(){
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.lang-switch');
      if (btn){ const menu = btn.nextElementSibling && btn.nextElementSibling.classList.contains('lang-menu') ? btn.nextElementSibling : null; if(menu){ const open = !menu.hasAttribute('hidden'); closeAllMenus(); if(open){ menu.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); } else { menu.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); focusFirstItem(menu); } } return; }
      const item = e.target.closest('[data-lang]');
      if (item){ const l=item.getAttribute('data-lang'); setLang(l); closeAllMenus(); }
      else { if (!e.target.closest('.lang-menu')) closeAllMenus(); }
    });
    document.addEventListener('keydown', (e)=>{
      // ESC closes any open menu
      if (e.key==='Escape'){ closeAllMenus(); }
      const openMenu = [...document.querySelectorAll('.lang-menu')].find(m=> !m.hasAttribute('hidden'));
      if (!openMenu) return;
      if (e.key==='ArrowDown' || e.key==='ArrowUp'){
        e.preventDefault(); const active=document.activeElement; const dir=e.key==='ArrowDown'?1:-1; focusNextItem(openMenu, active, dir);
      }
      if (e.key==='Enter' || e.key===' '){
        const it = document.activeElement && document.activeElement.closest('[data-lang]');
        if (it){ e.preventDefault(); setLang(it.getAttribute('data-lang')); closeAllMenus(); }
      }
    });
  }

  function enhanceTables(){
    document.querySelectorAll('table').forEach(tbl=>{
      // scope=col for header cells
      tbl.querySelectorAll('thead th').forEach(th=>{ if(!th.hasAttribute('scope')) th.setAttribute('scope','col'); });
    });
  }

  function injectFocusStyles(){
    if (document.getElementById('aidify-i18n-focus-styles')) return;
    const s=document.createElement('style'); s.id='aidify-i18n-focus-styles'; s.textContent = `
      .lang-menu [data-lang]:focus{ outline:2px solid #3797a4; outline-offset:2px; background: rgba(55,151,164,.08); }
    `; document.head.appendChild(s);
  }

  // Expose
  window.AIDIFY_I18N = { t, apply: applyI18N, setLang, getLang, DICT };

  document.addEventListener('DOMContentLoaded', ()=>{ enhanceMenus(); bindSwitches(); applyI18N(); updateBadges(); updateDocLang(); enhanceTables(); injectFocusStyles(); });
})();
