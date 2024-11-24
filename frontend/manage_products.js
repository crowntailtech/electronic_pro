// Fetch and Display Products
async function loadProducts() {
    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');
    const token = localStorage.getItem('access_token');
    const productList = document.getElementById('product-list');

    if (!token) {
        alert('You must be logged in as a seller to view this page.');
        window.location.href = 'login.html';
        return;
    }

    if (!productList) {
        console.error('Product list container is missing in the HTML.');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}:8000/api/seller/products/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const responseData = await response.json();
            const products = responseData.products || [];
            if (!Array.isArray(products)) {
                throw new TypeError('Products data is not an array.');
            }

            if (products.length === 0) {
                productList.innerHTML = '<p>No products available. Add your first product!</p>';
                return;
            }

            productList.innerHTML = '';
            products.forEach(product => {
                const productCard = `
                    <div class="product-card">
                        <img src="${product.image_url || 'placeholder.jpg'}" alt="${product.name}" />
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p><strong>Price:</strong> ₹${product.price}</p>
                        <p class="stock"><strong>Stock:</strong> ${product.stock}</p>
                        <button onclick="deleteProduct(${product.id})">Delete</button>
                        <button onclick="editProduct(${product.id}, '${product.name}', '${product.description}', ${product.price}, ${product.stock}, '${product.image_url || ''}')">Edit</button>
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


// Add or Edit Product
document.getElementById('product-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');

    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;
    const image = document.getElementById('product-image').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    if (image) formData.append('image', image);

    const token = localStorage.getItem('access_token');
    const productId = document.getElementById('product-form').getAttribute('data-edit-id'); // If editing

    if (productId) {
        formData.append('product_id', productId); // Append product_id for editing
    }

    try {
        const response = await fetch(
            productId ? `${apiUrl}:8000/api/seller/edit/` : `${apiUrl}:8000/api/seller/add/`,
            {
                method: productId ? 'PUT' : 'POST', // PUT for editing, POST for adding
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (response.ok) {
            alert(productId ? 'Product updated successfully' : 'Product added successfully');
            loadProducts();
            hideAddProductForm();
            document.getElementById('product-form').removeAttribute('data-edit-id'); // Reset edit ID
        } else {
            const errorData = await response.json();
            alert('Failed to save product: ' + (errorData.error || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('An error occurred while saving the product.');
    }
});

// Delete Product
async function deleteProduct(productId) {
    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');
    const token = localStorage.getItem('access_token');

    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${apiUrl}:8000/api/seller/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product_id: productId }), // Send payload in DELETE request
            });

            if (response.ok) {
                alert('Product deleted successfully');
                loadProducts();
            } else {
                const errorData = await response.json();
                alert('Failed to delete product: ' + (errorData.error || 'Unknown error.'));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('An error occurred while deleting the product.');
        }
    }
}

// Edit Product
function editProduct(productId, name, description, price, stock, image_url) {
    document.getElementById('product-name').value = name;
    document.getElementById('product-description').value = description;
    document.getElementById('product-price').value = price;
    document.getElementById('product-stock').value = stock;

    if (image_url) {
        document.getElementById('existing-image').src = image_url; // Display the existing image
        document.getElementById('existing-image-container').style.display = 'block'; // Show container if hidden
    } else {
        document.getElementById('existing-image-container').style.display = 'none';
    }

    document.getElementById('product-form').setAttribute('data-edit-id', productId); // Set ID for editing
    showAddProductForm();
}


// Fetch Logged-In User Info
async function setGreeting() {
    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');
    const token = localStorage.getItem('access_token');

    if (!token) {
        alert('You must be logged in to access this page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${apiUrl}:8000/api/user/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const user = await response.json();
            if (user.is_seller) {
                document.getElementById('greeting').innerText = `Welcome, ${user.username}`;
            } else {
                alert('You are not authorized to view this page.');
                window.location.href = 'login.html';
            }
        } else {
            alert('Failed to fetch user details. Redirecting to login...');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        document.getElementById('greeting').innerText = 'Welcome, Seller';
    }
}

// Show Add Product Form
function showAddProductForm() {
    document.getElementById('add-product-form').style.display = 'block';
}

// Hide Add Product Form
function hideAddProductForm() {
    document.getElementById('add-product-form').style.display = 'none';
    document.getElementById('product-form').reset(); // Reset form
    document.getElementById('product-form').removeAttribute('data-edit-id'); // Reset edit ID
}

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    loadProducts();
});

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    alert('You have been logged out.');
    window.location.href = 'login.html';
}