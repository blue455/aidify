/* ===========================
   AIDIFY — Setup Store (minimal)
   Tech: HTML/CSS/JS (no deps)
   Persistent state via localStorage
=========================== */

const LS = { store: "aidify.store" };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

(function initSetup(){
  // Get logged-in auth info from localStorage
  let __aidifyAuth = null;
  try { __aidifyAuth = JSON.parse(localStorage.getItem('aidify.auth') || 'null'); } catch(e) { __aidifyAuth = null; }
  if (!__aidifyAuth || !__aidifyAuth.email) {
    // If not logged in, redirect to auth
    alert('Please login to set up your store.');
    window.location.href = '/auth';
    return;
  }
  const imgInput = document.getElementById("storeImage");
  const preview = document.getElementById("storeImagePreview");
  const tipBox = document.getElementById('tipBox');
  const companyName = document.getElementById('companyName');
  const phone = document.getElementById('phone');
  const stepBars = [
    document.getElementById('stepBar1'),
    document.getElementById('stepBar2'),
    document.getElementById('stepBar3')
  ];

  if (imgInput) {
    imgInput.addEventListener("change", async () => {
      const file = imgInput.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataURL(file);
      preview.src = dataUrl;
      updateProgress();
      rotateTip();
    });
  }

  // Progress calculation: 3 segments
  function updateProgress(){
    const seg1 = companyName.value.trim().length > 1 ? 100 : 40; // started typing
    const seg2 = phone.value.trim().length > 5 ? 100 : (phone.value ? 60 : 20);
    const seg3 = preview && preview.src ? 100 : 20;
    const vals = [seg1, seg2, seg3];
    stepBars.forEach((bar,i)=>{ if (bar) bar.style.width = vals[i] + '%'; });
  }

  [companyName, phone].forEach(el=> el && el.addEventListener('input', ()=>{ updateProgress(); rotateTip(); }));
  updateProgress();

  const tips = [
    'Pro tip: Upload your logo to make your shop unforgettable.',
    'Did you know? Stores with clear names get more visits.',
    'Adding a short description helps buyers trust your brand.',
    'You can always change these later from your dashboard.'
  ];
  let tipIdx = 0;
  function rotateTip(){
    if (!tipBox) return;
    tipIdx = (tipIdx+1) % tips.length;
    tipBox.textContent = tips[tipIdx];
  }

  const form = document.getElementById("setupForm");
  if (form) {
    let submitting = false;
    const submitBtn = form.querySelector('button[type="submit"], .cta');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;
      submitting = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

      const companyNameVal = document.getElementById("companyName").value.trim();
      if (!companyNameVal) {
        alert('Please enter your company name');
        submitting = false; if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
        return;
      }
      const store = {
        companyName: companyNameVal,
        countryCode: document.getElementById("countryCode").value,
        phone: document.getElementById("phone").value.trim(),
        types: [...document.querySelectorAll("input[name='types']:checked")].map(i=>i.value),
        storeDesc: document.getElementById("storeDesc").value.trim(),
        image: preview?.src || null
      };
      try {
        const resp = await fetch('/api/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerEmail: __aidifyAuth && __aidifyAuth.email, name: companyNameVal, description: store.storeDesc })
        });
        const text = await resp.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (resp.ok) {
          const sid = data && (data.shopId || data.id);
          if (sid) store.shopId = sid;
          write(LS.store, store);
          window.location.href = "sellersStore.html#/create-product";
          return;
        }
        const msg = (data && data.message) || `Failed to create shop${resp.status?` (HTTP ${resp.status})`:''}.`;
        alert(msg);
      } catch (err) {
        console.error('Shop creation failed:', err);
        alert('Could not create shop. Please try again.');
      } finally {
        submitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
      }
    });
  }

  function fileToDataURL(file){
    return new Promise((res, rej)=>{
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }
})();
