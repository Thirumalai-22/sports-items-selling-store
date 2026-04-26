// app.js

// --- Authentication Functions ---
async function signUp(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (name && email && password) {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Signup successful! Please log in.');
        window.location.href = 'login.html';
      } else {
        alert(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error during signup');
    }
  } else {
    alert('Please fill in all fields.');
  }
}

async function login(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      alert('Login successful!');
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    alert('Error during login');
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (err) {
    console.error('Error logging out from server:', err);
  }
  localStorage.removeItem('currentUser');
  alert('Logged out successfully.');
  window.location.href = 'index.html';
}
async function checkSession() {
  try {
    const res = await fetch('/api/session');
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
  updateAuthUI();
}

function updateAuthUI() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // Update header right menu across all pages
  const rightMenu = document.querySelector('.right-menu');
  if (rightMenu) {
    // Clear existing auth links
    const existingAuth = rightMenu.querySelectorAll('.auth-link');
    existingAuth.forEach(el => el.remove());

    if (currentUser) {
      const welcomeSpan = document.createElement('span');
      welcomeSpan.className = 'auth-link';
      welcomeSpan.style.marginRight = '10px';
      welcomeSpan.innerText = `Hi, ${currentUser.name}`;

      const logoutBtn = document.createElement('a');
      logoutBtn.href = '#';
      logoutBtn.className = 'auth-link';
      logoutBtn.innerText = 'Logout';
      logoutBtn.onclick = logout;

      rightMenu.prepend(logoutBtn);
      
      // If user is admin, show Admin Panel button
      if (currentUser.role === 'admin') {
         const adminBtn = document.createElement('a');
         adminBtn.href = '/admin';
         adminBtn.className = 'auth-link';
         adminBtn.innerText = 'Admin Panel';
         adminBtn.style.color = 'darkorange';
         adminBtn.style.fontWeight = 'bold';
         adminBtn.style.marginRight = '15px';
         rightMenu.prepend(adminBtn);
      }

      rightMenu.prepend(welcomeSpan);
    } else {
      const loginLink = document.createElement('a');
      loginLink.href = 'login.html';
      loginLink.className = 'auth-link';
      loginLink.innerText = 'Login';

      const signupLink = document.createElement('a');
      signupLink.href = 'signup.html';
      signupLink.className = 'auth-link';
      signupLink.innerText = 'Sign Up';

      rightMenu.prepend(signupLink);
      rightMenu.prepend(loginLink);
    }
  }

  // Common Nav Links Fixing (since we are modifying app.js which is included everywhere)
  const leftMenu = document.querySelector('.left-menu');
  if (leftMenu) {
    // Ensure all links point to standard files
    const links = leftMenu.querySelectorAll('a');
    links.forEach(a => {
      if (a.innerText.trim() === 'Home') a.href = 'index.html';
      if (a.innerText.trim() === 'Categories') a.href = 'cat.html';
      if (a.innerText.trim() === 'About') a.href = 'about.html';
      if (a.innerText.trim() === 'About us') a.href = 'about.html';
      if (a.innerText.trim() === 'Contact') a.href = 'cont.html';
      if (a.innerText.trim() === 'Contact us') a.href = 'cont.html';
    });
  }
  if (rightMenu) {
    const links = rightMenu.querySelectorAll('a');
    links.forEach(a => {
      if (a.innerText.trim() === '❤️') a.href = 'wish.html';
      if (a.innerText.trim() === '🔍') a.href = 'search.html';
      if (a.innerText.trim() === '🛒') a.href = 'cart.html';
    });
  }
}

// --- Cart Functions (Backend) ---
async function addToCart(name, price, image) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please login to add items to cart.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, name, price, image_url: image })
    });
    if (res.ok) {
      alert(`${name} added to cart!`);
    } else {
      alert('Failed to add to cart');
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateCartQuantity(id, newQuantity) {
  if (newQuantity < 0) return;
  try {
    await fetch(`/api/cart/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: parseInt(newQuantity) })
    });
    renderCart();
  } catch (err) {
    console.error(err);
  }
}

async function renderCart() {
  const cartContainer = document.querySelector('.cart-container');
  if (!cartContainer) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    cartContainer.innerHTML = '<h1>Your Shopping Cart</h1><p style="text-align:center;">Please <a href="login.html">login</a> to view your cart.</p><p style="text-align:center;"><a href="index.html">← Back to Home</a></p>';
    return;
  }

  cartContainer.innerHTML = '<h1>Your Shopping Cart</h1><p style="text-align:center;"><a href="index.html">← Back to Home</a></p>';

  try {
    const res = await fetch(`/api/cart?user_id=${currentUser.id}`);
    const cart = await res.json();

    if (cart.length === 0) {
      cartContainer.innerHTML += '<p style="text-align:center;">Your cart is empty.</p>';
      return;
    }

    let subtotal = 0;

    cart.forEach((item) => {
      const priceValue = parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
      subtotal += priceValue * item.quantity;

      const cartItemHTML = `
        <div class="cart-item">
          <div class="item-details">
            <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80'">
            <div class="item-info">
              <h4>${item.name}</h4>
            </div>
          </div>
          <div class="quantity">
            Qty: <input type="number" value="${item.quantity}" min="0" onchange="updateCartQuantity(${item.id}, this.value)">
          </div>
          <div class="price">₹${item.price}</div>
        </div>
      `;
      cartContainer.innerHTML += cartItemHTML;
    });

    const shipping = 100;
    const total = subtotal + shipping;

    const summaryHTML = `
      <div class="summary">
        <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
        <p>Shipping: ₹${shipping.toFixed(2)}</p>
        <p class="total">Total: ₹${total.toFixed(2)}</p>
        <button class="checkout-btn" onclick="checkout()">Proceed to Checkout</button>
      </div>
    `;
    cartContainer.innerHTML += summaryHTML;
  } catch (err) {
    console.error(err);
    cartContainer.innerHTML += '<p style="text-align:center;">Error loading cart.</p>';
  }
}

async function checkout() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if(!currentUser) return;
  
  try {
    const res = await fetch('/api/cart/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id })
    });
    if (res.ok) {
      alert('Thank you for your purchase! Order placed successfully.');
      renderCart();
    }
  } catch(err) {
    console.error(err);
  }
}

// --- Wishlist Functions (Backend) ---
async function addToWishlist(name, price, image) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please login to add items to wishlist.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, name, price, image_url: image })
    });
    if (res.ok) {
      alert(`${name} added to wishlist!`);
    } else {
      alert('Failed to add to wishlist');
    }
  } catch (err) {
    console.error(err);
  }
}

async function removeWishlistItem(id) {
  try {
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
    renderWishlist();
  } catch (err) {
    console.error(err);
  }
}

async function renderWishlist() {
  const container = document.getElementById('gridContainer');
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Please <a href="login.html">login</a> to view your wishlist.</p>';
    document.getElementById('totalItems').innerText = '0';
    document.getElementById('totalValue').innerText = '₹0';
    return;
  }

  try {
    const res = await fetch(`/api/wishlist?user_id=${currentUser.id}`);
    const items = await res.json();
    
    document.getElementById('totalItems').innerText = items.length;
    
    let totalVal = 0;
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Your wishlist is empty.</p>';
      document.getElementById('totalValue').innerText = '₹0';
      return;
    }

    items.forEach(item => {
      totalVal += parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
      container.innerHTML += `
        <div class="wishlist-item" style="border: 1px solid #ddd; border-radius: 10px; padding: 15px; background: white; margin-bottom: 20px;">
            <div class="item-image" style="position:relative; text-align:center;">
                <img src="${item.image_url}" onerror="this.src='https://via.placeholder.com/150'" style="max-width: 100%; border-radius: 8px;">
                <button class="remove-btn" onclick="removeWishlistItem(${item.id})" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:25px; height:25px; cursor:pointer;">×</button>
            </div>
            <div class="item-details" style="margin-top:10px;">
                <div class="item-title" style="font-weight:bold; font-size:16px;">${item.name}</div>
                <div class="item-price" style="color: #007bff; font-weight:bold; margin-top:5px;">
                    <span class="current-price">₹${item.price}</span>
                </div>
                <div class="item-actions" style="margin-top: 10px;">
                    <button class="cart-btn" onclick="addToCart('${item.name}', '${item.price}', '${item.image_url}')" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; width:100%;">Add to Cart</button>
                </div>
            </div>
        </div>
      `;
    });
    
    document.getElementById('totalValue').innerText = '₹' + totalVal.toFixed(2);
    
    // Bind action buttons
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) {
        clearAllBtn.onclick = async () => {
            if(!confirm('Clear entire wishlist?')) return;
            for(let item of items) {
                await fetch(`/api/wishlist/${item.id}`, { method: 'DELETE' });
            }
            renderWishlist();
        };
    }

    const addAllToCartBtn = document.getElementById('addAllToCart');
    if (addAllToCartBtn) {
        addAllToCartBtn.onclick = async () => {
            for(let item of items) {
                await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.id, name: item.name, price: item.price, image_url: item.image_url })
                });
            }
            alert('All items added to cart!');
        };
    }

    const shareBtn = document.getElementById('shareWishlist');
    if (shareBtn) {
        shareBtn.onclick = () => {
            alert('Share link copied to clipboard!');
        };
    }
    
  } catch(err) {
    console.error(err);
    container.innerHTML = '<p>Error loading wishlist.</p>';
  }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  
  if (window.location.pathname.includes('cart.html')) {
    renderCart();
  }
  
  if (window.location.pathname.includes('wish.html')) {
    renderWishlist();
  }

  // Fetch dynamic products from SQLite DB if on main page
  const productContainer = document.querySelector('.product-container');
  if (productContainer && !window.location.pathname.includes('cart.html') && !window.location.pathname.includes('wish.html')) {
     fetch('/api/products')
      .then(res => res.json())
      .then(products => {
         if (products && products.length > 0) {
            products.forEach(p => {
               const card = document.createElement('div');
               card.className = 'card';
               card.innerHTML = `
                 <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                 <h2>${p.name}</h2>
                 <p class="price">₹${p.price}</p>
                 <button class="add-cart">Add to Cart</button>
                 <button class="add-wish" style="margin-top:5px; background-color:#ffc107; color:black;">Add to Wishlist</button>
               `;
               productContainer.prepend(card);
               productContainer.prepend(document.createElement('br'));
            });
            attachCartListeners();
         } else {
            attachCartListeners();
         }
      })
      .catch(err => {
         console.error('Error fetching products:', err);
         attachCartListeners();
      });
  } else {
     attachCartListeners();
  }
});

function attachCartListeners() {
  // First, dynamically inject the wishlist button if it's missing on any card
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
     if (!card.querySelector('.add-wish') && card.querySelector('.add-cart')) {
         const wishBtn = document.createElement('button');
         wishBtn.className = 'add-wish';
         wishBtn.innerText = 'Add to Wishlist';
         wishBtn.style.backgroundColor = '#ffc107';
         wishBtn.style.color = 'black';
         wishBtn.style.border = 'none';
         wishBtn.style.padding = '8px 12px';
         wishBtn.style.marginTop = '5px';
         wishBtn.style.borderRadius = '5px';
         wishBtn.style.cursor = 'pointer';
         wishBtn.style.fontSize = '14px';
         wishBtn.style.width = 'auto'; // or 100% if needed
         
         card.appendChild(wishBtn);
     }
  });

  const addCartBtns = document.querySelectorAll('.add-cart');
  addCartBtns.forEach(btn => {
    if(btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = 'true';
    
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        const name = card.querySelector('h2').innerText;
        const priceElement = card.querySelector('.price');
        let price = '';
        if (priceElement) {
           const clone = priceElement.cloneNode(true);
           const discount = clone.querySelector('.discount');
           if(discount) discount.remove();
           price = clone.innerText.trim();
        }
        const imgElement = card.querySelector('img');
        const img = imgElement.getAttribute('src');
        addToCart(name, price, img);
      }
    });
  });

  // Attach wishlist buttons (if any are manually added in HTML, or dynamically added above)
  const addWishBtns = document.querySelectorAll('.add-wish, .wish-btn');
  addWishBtns.forEach(btn => {
    if(btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = 'true';
    
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        const name = card.querySelector('h2').innerText;
        const priceElement = card.querySelector('.price');
        let price = '';
        if (priceElement) {
           const clone = priceElement.cloneNode(true);
           const discount = clone.querySelector('.discount');
           if(discount) discount.remove();
           price = clone.innerText.trim();
        }
        const imgElement = card.querySelector('img');
        const img = imgElement.getAttribute('src');
        addToWishlist(name, price, img);
      }
    });
  });

  // Attach Subscribe Button Logic
  const subscribeBtns = document.querySelectorAll('.subscribe button');
  subscribeBtns.forEach(btn => {
    if(btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = 'true';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const input = btn.parentElement.querySelector('input[type="email"]');
      if(input && input.value.trim() !== '' && input.value.includes('@')) {
        const userEmail = input.value;
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            const data = await res.json();
            if(res.ok) {
                alert('Thank you for subscribing! An email has been sent to ' + userEmail);
                input.value = '';
            } else {
                alert('Failed to subscribe: ' + (data.error || 'Unknown error'));
            }
        } catch(err) {
            console.error(err);
            alert('Error sending email request.');
        }
      } else {
        alert('Please enter a valid email address.');
      }
    });
  });

  // Attach Download App Button Logic
  const downloadBtns = document.querySelectorAll('.download-btn');
  downloadBtns.forEach(btn => {
      if(btn.dataset.listenerAttached) return;
      btn.dataset.listenerAttached = 'true';
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('App download will begin shortly! (Simulated)');
      });
  });
}
