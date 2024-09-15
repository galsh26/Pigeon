const apiUrl = 'http://localhost:8000'; // Update with your actual API URL
let accessToken = localStorage.getItem('accessToken') || '';

// Function to display messages
function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? 'red' : 'green';
}

// Save accessToken to localStorage when logging in
function saveToken(token) {
    accessToken = token;
    localStorage.setItem('accessToken', token);
    // Redirect to the main page within the iframe
    window.parent.postMessage('loadMainPage', '*');
}

// Clear accessToken from localStorage when logging out
function clearToken() {
    accessToken = '';
    localStorage.removeItem('accessToken');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('logoutSection').style.display = 'none';
    document.getElementById('meSection').style.display = 'none';
}

// Check if accessToken exists and is valid
async function validateToken() {
    if (accessToken) {
        try {
            const response = await fetch(`${apiUrl}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Token is valid, redirect to the main page within the iframe
                window.parent.postMessage('loadMainPage', '*');
            } else {
                // Invalid token, show the login form
                clearToken();
            }
        } catch (error) {
            console.error('Error validating token:', error);
            clearToken();
        }
    }
}

// Login form submit handler
document.getElementById('login').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    try {
        const response = await fetch(`${apiUrl}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            saveToken(data.access_token);
            showMessage('Logged in successfully!');
        } else {
            showMessage('Login failed', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Login failed: ' + error.message, true);
    }
});

// Logout button handler
document.getElementById('logoutBtn').addEventListener('click', async function () {
    if (!accessToken) {
        showMessage('You are not logged in!', true);
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            clearToken();
            showMessage('Logged out successfully!');
        } else {
            showMessage('Logout failed', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Logout failed: ' + error.message, true);
    }
});

// Get profile button handler
document.getElementById('getProfileBtn').addEventListener('click', async function () {
    if (!accessToken) {
        showMessage('You are not logged in!', true);
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/users/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('profileData').textContent = JSON.stringify(data, null, 2);
            showMessage('Profile fetched successfully!');
        } else {
            showMessage('Failed to get profile', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to get profile: ' + error.message, true);
    }
});

// Placeholder register button functionality
document.getElementById('registerBtn').addEventListener('click', function () {
    alert('Register functionality coming soon!');
    window.location.href = 'register.html';
});

// Validate token on page load
document.addEventListener('DOMContentLoaded', validateToken);