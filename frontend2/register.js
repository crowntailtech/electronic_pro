document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isSellerChecked = document.getElementById('is-seller').checked;

    // Determine role based on the checkbox
    const payload = {
        username: username,
        email: email,
        password: password,
        is_seller: isSellerChecked,
        is_buyer: !isSellerChecked, // Automatically set to true if "is_seller" is false
    };

    try {
        const response = await fetch('http://localhost:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = 'login.html';
        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.message || 'Registration failed.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
