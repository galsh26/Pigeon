// Function to dynamically load HTML content into the extension's popup
function loadPage(url, containerId) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(containerId).innerHTML = data;
            document.getElementById(containerId).style.display = "block";
            document.getElementById("mainContent").style.display = "none"; // Hide the main page content
        })
        .catch(error => console.error('Error loading page:', error));
}

// Function to return to the main content
function goToMainPage() {
    document.getElementById("dynamicContent").style.display = "none"; // Hide the dynamic content
    document.getElementById("mainContent").style.display = "block"; // Show the main content
}

// Event listener to open the "Create New Tag" form within the current page
document.getElementById("createTagButton").addEventListener("click", function() {
    loadPage("create_tag.html", "dynamicContent");
});

// Function to handle adding tags (modify as needed for your application logic)
document.getElementById("addTagButton").addEventListener("click", function() {
    // Here, you can handle adding a tag or open a form for adding tags
    console.log('Add Tag button clicked');
    alert('Add Tag button clicked. Implement your logic here.');
});

// Function to handle logout functionality
document.getElementById("logoutButton").addEventListener("click", function() {
    // Handle logout functionality by clearing token or calling a logout API
    fetch('http://127.0.0.1:8000/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')  // Adjust as needed for your token
        }
    })
    .then(response => {
        if (response.ok) {
            localStorage.removeItem('accessToken');  // Remove access token on logout
            alert('Logged out successfully');
            window.location.href = 'login_screen.html';  // Redirect to login screen or home page
        } else {
            alert('Failed to log out');
        }
    })
    .catch(error => console.error('Error during logout:', error));
});

// Fetch and display keywords (you can modify the API URL and logic as needed)
function fetchKeywords() {
    fetch('http://127.0.0.1:8000/all-keyword', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')  // Adjust as needed for your token
        }
    })
    .then(response => response.json())
    .then(data => {
        const keywordList = document.getElementById("keywordList");
        keywordList.innerHTML = '';  // Clear the current list

        data.forEach(keyword => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = keyword;

            const label = document.createElement("label");
            label.textContent = keyword;

            const div = document.createElement("div");
            div.appendChild(checkbox);
            div.appendChild(label);

            keywordList.appendChild(div);
        });
    })
    .catch(error => console.error('Error fetching keywords:', error));
}

// Fetch and display tag titles (you can modify the API URL and logic as needed)
function fetchTagTitles() {
    fetch('http://127.0.0.1:8000/user-all-tags', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')  // Adjust as needed for your token
        }
    })
    .then(response => response.json())
    .then(data => {
        const titleList = document.getElementById("titleList");
        titleList.innerHTML = '';  // Clear the current list

        data.forEach(tag => {
            const div = document.createElement("div");
            div.classList.add('tile');

            const img = document.createElement("img");
            img.src = `data:image/png;base64,${tag.picture}`;  // Assuming the image is base64 encoded

            const contentDiv = document.createElement("div");
            contentDiv.classList.add('tile-content');

            const title = document.createElement("h4");
            title.textContent = tag.title;

            const description = document.createElement("p");
            description.textContent = tag.description;

            contentDiv.appendChild(title);
            contentDiv.appendChild(description);
            div.appendChild(img);
            div.appendChild(contentDiv);

            titleList.appendChild(div);
        });
    })
    .catch(error => console.error('Error fetching tag titles:', error));
}

// Event listener to open the "Create New Tag" form within the current page
document.getElementById("createTagButton").addEventListener("click", function() {
    loadPage("create_tag.html", "dynamicContent");
});

// Initial fetch for keywords and tags when the page loads
document.addEventListener("DOMContentLoaded", function() {
    fetchKeywords();
    fetchTagTitles();
});
