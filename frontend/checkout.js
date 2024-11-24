document.addEventListener('DOMContentLoaded', function () {
    // Load Product Details from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productName = urlParams.get('name') || 'Unknown Product';
    const productPrice = urlParams.get('price') || '0';

    if (!productId) {
        alert('No product selected. Redirecting to home page.');
        window.location.href = 'home.html';
        return;
    }

    document.getElementById('product-name').value = productName;
    document.getElementById('product-price').value = `$${productPrice}`;
});

// Handle Checkout Form Submission
document.getElementById('checkout-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); // Ensure productId is passed to the API
    const quantity = document.getElementById('quantity').value;
    const address = document.getElementById('address').value;

    const payload = {
        product_id: productId,
        quantity: quantity,
        address: address,
    };

    const token = localStorage.getItem('access_token');

    if (!token) {
        alert('Please log in to place an order.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${apiUrl}:8000/api/order/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert('Order placed successfully!');
            window.location.href = 'order.html'; // Redirect to Order History
        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.message || 'Failed to place order.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

// Handle Cancel Button
function cancelCheckout() {
    window.location.href = 'home.html';
}

// Logout Function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert('You have been logged out.');
    window.location.href = 'login.html';
}
