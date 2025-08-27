window.onload = async function() {
    // Get user city and age (for demo, use localStorage or prompt)
    let city = localStorage.getItem('userCity');
    let age = localStorage.getItem('userAge');
    if (!city || !age) {
        city = prompt('Enter your city (e.g. Lagos, Abuja, Ibadan, Port Harcourt):', 'Lagos');
        age = prompt('Enter your age:', '25');
        localStorage.setItem('userCity', city);
        localStorage.setItem('userAge', age);
    }
    // Fetch personalized offers
    const offersRes = await fetch(`/offers?city=${encodeURIComponent(city)}&age=${encodeURIComponent(age)}`);
    const offers = await offersRes.json();

    // Carousel: show featured offers with product images
    const carousel = document.getElementById('offers-carousel');
    carousel.innerHTML = '';
    offers.forEach((offer, idx) => {
        const imgSrc = offer.image ? `/images/${offer.image}` : '/images/default-product.svg';
        const item = document.createElement('div');
        item.className = 'offers-carousel-item';
        item.innerHTML = `
            <img src='${imgSrc}' alt='${offer.title}' class='offers-carousel-img' style='height:60px;width:auto;position:absolute;top:1rem;left:1rem;border-radius:8px;box-shadow:0 2px 8px #007bff22;' onerror="this.onerror=null;this.src='/images/default-product.svg'">
            <div class='offers-carousel-title' style='margin-left:70px;'>${offer.title}</div>
            <div class='offers-carousel-desc' style='margin-left:70px;'>${offer.description}</div>
            <div style='display: flex; gap: 0.5rem; margin-left:70px; margin-top: 0.7rem;'>
                <button class='offers-carousel-action' onclick="redirectToPayment('${offer.title}', '${offer.description}')">Buy</button>
                <button class='offers-add-to-cart' style='padding: 0.6rem 1.2rem; font-size: 0.9rem;' onclick="addToCart('${offer.title}', '${offer.description}')">Add to Cart</button>
            </div>
            ${offer.flash ? "<span class='flash' style='position:absolute;top:1rem;right:1rem;'>Flash Sale!</span>" : ''}
        `;
        carousel.appendChild(item);
    });

    // Flash Sale banners for offers marked as flash
    const flashSale = document.getElementById('offers-flash-sale');
    flashSale.innerHTML = '';
    offers.filter(o => o.flash).forEach(offer => {
        const imgSrc = offer.image ? `/images/${offer.image}` : '/images/default-product.svg';
        const banner = document.createElement('div');
        banner.className = 'offers-flash-banner';
        banner.innerHTML = `
            <img src='${imgSrc}' alt='${offer.title}' style='height:40px;width:auto;vertical-align:middle;margin-right:1rem;border-radius:6px;'>
            🔥 Flash Sale: <b>${offer.title}</b> <span style='margin-left:1rem;'>${offer.description}</span>
        `;
        flashSale.appendChild(banner);
    });

    // Product grid: recommended products with images
    const grid = document.getElementById('offers-grid');
    grid.innerHTML = '';
    offers.forEach(offer => {
        const imgSrc = offer.image ? `/images/${offer.image}` : '/images/default-product.svg';
        const card = document.createElement('div');
        card.className = 'offers-product-card';
        card.innerHTML = `
            <img src='${imgSrc}' alt='${offer.title}' style='height:60px;width:auto;margin-bottom:0.7rem;border-radius:8px;box-shadow:0 2px 8px #007bff22;' onerror="this.onerror=null;this.src='/images/default-product.svg'">
            <div class='offers-product-title'>${offer.title}</div>
            <div class='offers-product-price'>${offer.description}</div>
            <div class="button-group" style="display: flex; gap: 0.5rem; margin-top: 1.2rem; width: 100%;">
                <button class='offers-product-action' onclick="redirectToPayment('${offer.title}', '${offer.description}')">Buy</button>
                <button class='offers-add-to-cart' onclick="addToCart('${offer.title}', '${offer.description}')">Add to Cart</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Loyalty rewards section
    const loyalty = document.getElementById('offers-loyalty');
    loyalty.innerHTML = '';
    loyalty.appendChild(createLoyaltyCard('Gold Member', 'Enjoy 15% off all purchases and free shipping!'));
    loyalty.appendChild(createLoyaltyCard('Birthday Reward', 'Special gift for your birthday month!'));
    loyalty.appendChild(createLoyaltyCard('Cart Saver', 'Extra 5% off if you checkout today!'));
}

// Add redirect function to payment page
function redirectToPayment(productName, productDescription) {
    // Store product info in sessionStorage
    sessionStorage.setItem('selectedProduct', JSON.stringify({
        name: productName,
        description: productDescription
    }));
    
    // Redirect to payment page
    window.location.href = '/payment.html';
}

// Add to cart function
function addToCart(productName, productDescription) {
    // Get existing cart items or initialize empty array
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Add new item to cart
    const newItem = {
        name: productName,
        description: productDescription,
        addedAt: new Date().toISOString()
    };
    
    cartItems.push(newItem);
    
    // Save updated cart to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Show confirmation message
    alert(`${productName} has been added to your cart!`);
    
    // Optional: Update cart count display if you have one
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCount = cartItems.length;
    
    // You can add a cart count badge to your UI here
    console.log(`Cart updated: ${cartCount} items`);
}

function createLoyaltyCard(title, desc) {
    const card = document.createElement('div');
    card.className = 'offers-loyalty-card';
    card.innerHTML = `<div style='font-size:1.15rem;font-weight:700;'>${title}</div><div style='font-size:1rem;font-weight:400;margin-top:0.3rem;'>${desc}</div>`;
    return card;
}
