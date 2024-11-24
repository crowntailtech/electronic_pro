document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and user role
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Please log in to access the seller dashboard.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch user info to ensure the logged-in user is a seller
        const userResponse = await fetch('http://localhost:8000/api/user/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (userResponse.ok) {
            const user = await userResponse.json();

            // Redirect if the user is not a seller
            if (!user.is_seller) {
                alert('Unauthorized access. Redirecting to login...');
                window.location.href = 'login.html';
                return;
            }

            // Display the username in the greeting
            document.getElementById('greeting').innerText = `Welcome, ${user.username}`;
        } else {
            alert('Failed to fetch user information. Redirecting to login...');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        alert('An error occurred. Redirecting to login...');
        window.location.href = 'login.html';
    }

    // Load seller-specific content
    loadProducts();
    loadOrderHistory();
});

// Fetch and display products
async function loadProducts() {
    const token = localStorage.getItem('access_token');
    const productList = document.getElementById('product-list');

    if (!productList) {
        console.error('Product list container is missing in the HTML.');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/seller/products/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const products = await response.json();

            if (products.length === 0) {
                productList.innerHTML = '<p>No products available. Add your first product!</p>';
                return;
            }

            productList.innerHTML = '';
            products.forEach(product => {
                const productCard = `
                    <div class="product-card">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p><strong>Price:</strong> $${product.price}</p>
                        <button onclick="deleteProduct(${product.id})">Delete</button>
                        <button onclick="editProduct(${product.id}, '${product.name}', '${product.description}', ${product.price})">Edit</button>
                    </div>
                `;
                productList.innerHTML += productCard;
            });
        } else {
            console.error('Failed to fetch products');
            productList.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productList.innerHTML = '<p class="error-message">An error occurred. Please try again later.</p>';
    }
}


// Fetch and display order history
async function loadOrderHistory() {
    const token = localStorage.getItem('access_token');
    const orderList = document.getElementById('order-list');

    try {
        const response = await fetch('http://localhost:8000/api/seller/orders/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();

            // Adjust for API response format
            const orders = Array.isArray(data) ? data : data.orders;

            if (!orders || orders.length === 0) {
                orderList.innerHTML = '<p>No orders have been placed for your products yet.</p>';
                return;
            }

            orderList.innerHTML = '';
            orders.forEach(order => {
                const orderCard = `
                    <div class="order-card">
                        <h3>Order #${order.id}</h3>
                        <p><strong>Product:</strong> ${order.product.name}</p>
                        <p><strong>Buyer:</strong> ${order.buyer.username}</p>
                        <p><strong>Quantity:</strong> ${order.quantity}</p>
                        <p><strong>Total Price:</strong> $${order.total_price}</p>
                        <p><strong>Address:</strong> ${order.address}</p>
                        <p><strong>Ordered At:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    </div>
                `;
                orderList.innerHTML += orderCard;
            });
        } else {
            console.error('Failed to fetch orders');
            orderList.innerHTML = '<p class="error-message">Failed to load orders. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        orderList.innerHTML = '<p class="error-message">An error occurred. Please try again later.</p>';
    }
}


// Logout function
function logout() {
    localStorage.removeItem('access_token');
    alert('You have been logged out.');
    window.location.href = 'login.html';
}
