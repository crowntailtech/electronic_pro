document.addEventListener('DOMContentLoaded', async () => {
    // Set Greeting
    await setGreeting();

    // Load Products
    await loadProducts();
});

// Set Greeting Based on User Authentication
async function setGreeting() {
    const greetingElement = document.getElementById('greeting');
    const token = localStorage.getItem('access_token');

    if (!token) {
        greetingElement.innerText = 'Hello, Guest';
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/user/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const user = await response.json();
            greetingElement.innerText = `Hello, ${user.username}`;
        } else {
            greetingElement.innerText = 'Hello, Guest';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        greetingElement.innerText = 'Hello, Guest';
    }
}

// Fetch and Display Products
async function loadProducts() {
    const productList = document.getElementById('product-list');
    try {
        const response = await fetch('http://localhost:8000/api/products/');
        if (response.ok) {
            const data = await response.json();

            if (data.products.length === 0) {
                productList.innerHTML = '<p>No products available.</p>';
                return;
            }

            productList.innerHTML = ''; // Clear any existing products
            data.products.forEach(product => {
                const productCard = `
                    <div class="product-card">
                        <img src="${product.image_url || 'https://via.placeholder.com/150'}" alt="${product.name}" class="product-image">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p><strong>Price:</strong> $${product.price}</p>
                        <button onclick="buyNow(${product.id}, '${product.name}', '${product.price}')">Buy Now</button>
                    </div>
                `;
                productList.innerHTML += productCard;
            });
        } else {
            productList.innerHTML = '<p>Failed to load products. Please try again later.</p>';
            console.error('Failed to fetch products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productList.innerHTML = '<p>An error occurred. Please try again later.</p>';
    }
}

// Buy Now Button Handler
function buyNow(productId, productName, productPrice) {
    const queryString = `checkout.html?id=${productId}&name=${encodeURIComponent(productName)}&price=${productPrice}`;
    window.location.href = queryString;
}

// Logout Functionality
document.getElementById('logout-link').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert('You have been logged out.');
    window.location.href = 'login.html';
});
