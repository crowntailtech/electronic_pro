document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fullOrigin = window.location.origin;
    const apiUrl = fullOrigin.split(':').slice(0, 2).join(':');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const payload = {
        username: username,
        password: password,
    };

    try {
        const response = await fetch(`${apiUrl}:8000/api/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Read response JSON once
        const data = await response.json();

        if (response.ok) {
            alert('Login successful! Redirecting to your dashboard...');
            // Save tokens and user information to localStorage
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('is_seller', data.is_seller);
            localStorage.setItem('is_buyer', data.is_buyer);

            // Redirect based on role
            if (data.is_seller) {
                window.location.href = 'seller_dashboard.html';
            } else if (data.is_buyer) {
                window.location.href = 'index.html';
            } else {
                alert('Role not recognized. Please contact support.');
            }
        } else {
            alert('Error: ' + (data.message || 'Login failed.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
