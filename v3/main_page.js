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

// Function to fetch and display keywords
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
            checkbox.addEventListener('change', filterTags);  // Add event listener to filter tiles on selection

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

// Function to fetch and display tag titles
function fetchTagTitles() {
    fetch('http://127.0.0.1:8000/user-all-tags', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        }
    })
    .then(response => response.json())
    .then(data => {
        const titleList = document.getElementById("titleList");
        titleList.innerHTML = '';  // Clear the current list

        data.forEach(tag => {
            const div = document.createElement("div");
            div.classList.add('tile');
            div.setAttribute('data-keywords', tag.keywords);
            div.setAttribute('data-url', tag.url);

            const img = document.createElement("img");
            img.src = `data:image/png;base64,${tag.picture}`;

            const contentDiv = document.createElement("div");
            contentDiv.classList.add('tile-content');

            const title = document.createElement("h4");
            title.textContent = tag.title;

            const description = document.createElement("p");
            description.textContent = tag.description;

            contentDiv.appendChild(title);
            contentDiv.appendChild(description);
            div.appendChild(img);  // Image is added first to align it to the left
            div.appendChild(contentDiv);

            // Double-click event to open the URL in a new tab
            div.addEventListener('dblclick', function() {
                window.open(tag.url, '_blank');
            });

            // Create button group div
            const buttonGroup = document.createElement('div');
            buttonGroup.classList.add('button-group');

            // Add Buttons
            const discoverBtn = document.createElement('button');
            discoverBtn.textContent = 'Discover';
            discoverBtn.addEventListener('click', function() {
                window.location.href = `recs_for_website.html?url=${tag.url}`;
            });

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', function() {
                window.location.href = `edit_tag.html?url=${tag.url}`;
            });

            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.addEventListener('click', function() {
                updateTag(tag.url);
            });

            // Add Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', function() {
                showConfirmationPopup(tag.url);
            });

            // Append buttons to the button group
            buttonGroup.appendChild(discoverBtn);
            buttonGroup.appendChild(editBtn);
            buttonGroup.appendChild(okBtn);
            buttonGroup.appendChild(deleteBtn); // Add the delete button

            // Append button group to the tile
            contentDiv.appendChild(buttonGroup);

            // Append tile to the title list
            titleList.appendChild(div);
        });
    })
    .catch(error => console.error('Error fetching tag titles:', error));
}

// Function to show confirmation dialog and delete tag if confirmed
function showConfirmationPopup(url) {
    const userConfirmed = confirm('Are you sure you want to delete this tag?');

    if (userConfirmed) {
        deleteTag(url);
    } else {
        console.log('Tag deletion canceled');
    }
}

// Function to send DELETE request to remove the tag
function deleteTag(url) {
    const formData = new FormData();
    formData.append('url', url);

    fetch('http://127.0.0.1:8000/tag', {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        },
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        alert(data);  // Display the server response
        fetchTagTitles();  // Refresh the tag list after deletion
    })
    .catch(error => console.error('Error deleting tag:', error));
}





// Function to filter tags based on selected keywords and shrink the keyword list
function filterTags() {
    const selectedKeywords = Array.from(document.querySelectorAll('#keywordList input:checked')).map(checkbox => checkbox.value);
    const tiles = document.querySelectorAll('#titleList .tile');
    
    // Clear the search input when a keyword is selected
    document.getElementById('searchKeyword').value = '';

    // Variable to store keywords from visible tiles
    let remainingKeywords = new Set();

    tiles.forEach(tile => {
        const tileKeywords = tile.getAttribute('data-keywords').split(',');

        // Show all tiles if no keywords are selected
        if (selectedKeywords.length === 0) {
            tile.style.display = 'flex';
            tileKeywords.forEach(keyword => remainingKeywords.add(keyword)); // Add all keywords to the set
        } else {
            // Show tiles that contain all selected keywords
            const containsAllKeywords = selectedKeywords.every(keyword => tileKeywords.includes(keyword));
            if (containsAllKeywords) {
                tile.style.display = 'flex';
                tileKeywords.forEach(keyword => remainingKeywords.add(keyword)); // Add matching tile keywords to the set
            } else {
                tile.style.display = 'none';
            }
        }
    });

    // Now update the keyword list with only the remaining keywords
    updateKeywordList(Array.from(remainingKeywords));
}

// Init function to fetch data on page load
document.addEventListener("DOMContentLoaded", function() {
    fetchUsername(); // Fetch username and display the greeting
    fetchKeywords(); // Fetch keywords
    fetchTagTitles(); // Fetch tag titles
});


// On click listeners here!
// Tag creation button event listener
document.getElementById("createTagButton").addEventListener("click", function() {
    // loadPage("create_tag.html", "dynamicContent");
    window.location.href = 'create_tag.html';
});

// Add event listener for "Edit User" button to navigate to edit_user.html
document.getElementById('editUserButton').addEventListener('click', function() {
    window.location.href = 'edit_user.html';  // Navigate to the Edit User page
});

document.getElementById('searchKeyword').addEventListener('input', searchKeywords);

// Updating keyword list to reflect search results
function updateKeywordList(filteredKeywords) {
    const keywordList = document.getElementById("keywordList");

    // Get currently selected keywords
    const selectedKeywords = Array.from(document.querySelectorAll('#keywordList input:checked')).map(checkbox => checkbox.value);

    keywordList.innerHTML = '';  // Clear the current list

    filteredKeywords.forEach(keyword => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = keyword;

        // If this keyword was already selected, check the box
        if (selectedKeywords.includes(keyword)) {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', filterTags);  // Add event listener to filter tiles on selection

        const label = document.createElement("label");
        label.textContent = keyword;

        const div = document.createElement("div");
        div.appendChild(checkbox);
        div.appendChild(label);

        keywordList.appendChild(div);
    });
}

document.getElementById('logoutButton').addEventListener('click', function () {
    localStorage.removeItem('accessToken'); // Clear all localStorage tokens
    window.location.href = 'login_screen.html';  // Redirect to login page
});

// Function to fetch and display the username in the greeting
function fetchUsername() {
    fetch('http://127.0.0.1:8000/users/me', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')  // Use the stored token
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.username) {
            // Display "Hello, [username]" in the greeting div
            document.getElementById('greeting').textContent = 'Hello, ' + data.username;
        } else {
            console.error('Failed to fetch username:', data);
        }
    })
    .catch(error => console.error('Error fetching username:', error));
}

// Function to handle keyword search and update the list based on input
function searchKeywords() {
    const searchInput = document.getElementById('searchKeyword').value.toLowerCase();
    const keywordList = document.getElementById("keywordList");
    const allKeywords = Array.from(keywordList.querySelectorAll('input[type="checkbox"]')).map(checkbox => ({
        keyword: checkbox.value,
        checked: checkbox.checked
    }));

    // Filter keywords based on the search input
    const filteredKeywords = allKeywords.filter(({ keyword, checked }) => {
        // Always show checked keywords, or those matching the search query
        return checked || keyword.toLowerCase().includes(searchInput);
    });

    // Update the keyword list
    updateKeywordList(filteredKeywords.map(({ keyword }) => keyword));
}

// Function to uncheck all keyword checkboxes and show all tiles
function uncheckAllKeywords() {
    const checkboxes = document.querySelectorAll('#keywordList input[type="checkbox"]');
    
    // Uncheck all checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Clear the search input
    document.getElementById('searchKeyword').value = '';

    // Show all tiles
    const tiles = document.querySelectorAll('#titleList .tile');
    tiles.forEach(tile => {
        tile.style.display = 'flex';
    });

    // Reset keyword list to show all keywords
    fetchKeywords();
}

// Event listener for the Uncheck All button
document.getElementById('uncheckAllButton').addEventListener('click', uncheckAllKeywords);

