const submitBtn = document.getElementById('submitButton');

// Ensure this runs after the DOM has loaded
document.addEventListener('DOMContentLoaded', async function () {

    const token = localStorage.getItem('accessToken'); // Ensure accessToken exists

    // Test if token is found
    if (!token) {
        alert('Token not found');
        document.getElementById('result').innerText = 'You need to log in first.';
        return;
    }

    try {
        // Attempt to fetch the user data
        const response = await fetch('http://localhost:8000/user', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
            }
        });

        // Parse the response
        if (response.ok) {
            const data = await response.json();
            document.getElementById('email').innerText = data.email || 'Unknown';
            document.getElementById('uname').innerText = data.uname || 'Unknown';
            document.getElementById('submitButton').addEventListener('click', function () {
                window.location.href = `login_screen.html`;
            });
        } else {
            alert('Failed to fetch user details');
            document.getElementById('result').innerText = 'Failed to fetch user details.';
        }
    } catch (error) {
        // Handle errors
        document.getElementById('result').innerText = 'Error: ' + error.message;
        alert('Error occurred: ' + error.message);
    }
});

// Form submission for updating user details
document.getElementById('updateUserForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const cur_password = document.getElementById('cur_password').value;
    const n_uname = document.getElementById('n_uname').value;
    const n_password = document.getElementById('n_password').value;

    const token = localStorage.getItem('accessToken'); // Use the correct token key

    // Check if token is available
    if (!token) {
        document.getElementById('result').innerText = 'You need to log in first.';
        return;
    }

    // Create form data as required by FastAPI
    const formData = new FormData();
    formData.append('cur_password', cur_password);
    if (n_uname) formData.append('n_uname', n_uname);  // Add only if n_uname exists
    if (n_password) formData.append('n_password', n_password);  // Add only if n_password exists

    try {
        // Update user info
        const response = await fetch('http://localhost:8000/user', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData  // Send as form data
        });

        // Handle response
        const data = await response.json();
        if (response.ok) {
            document.getElementById('result').innerText = data || 'Update successful';
        } else {
            document.getElementById('result').innerText = 'Failed to update user: ' + data.detail;
        }
    } catch (error) {
        document.getElementById('result').innerText = 'Error: ' + error.message;
    }
});
