document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register');
    const backBtn = document.getElementById('backBtn');
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://127.0.0.1:8000/register', {  // Updated URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    uname: username,
                    email: email,
                    password: password
                })
            });

            if (response.ok) {
                document.getElementById('message').textContent = 'Registration successful!';
                // Optionally redirect to login page
                // window.location.href = 'login.html';
            } else {
                const errorData = await response.json();
                document.getElementById('message').textContent = 'Registration failed: ' + errorData.detail;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('message').textContent = 'Registration failed: ' + error.message;
        }
    });

    // Event listener for the Back button
    backBtn.addEventListener('click', function() {
        window.location.href = 'login_screen.html';
    });
});
