document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tagUrl = urlParams.get('url');

    const keywordList = document.getElementById('keywordList');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const pictureInput = document.getElementById('pictureInput');
    const urlLabel = document.getElementById('urlLabel');  // To display the URL

    let currentKeywords = [];

    // Display the URL in the label
    urlLabel.textContent = tagUrl;

    // Fetch tag data using the get_tag API endpoint
    fetch(`http://127.0.0.1:8000/tag?url=${encodeURIComponent(tagUrl)}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Tag data:", data);  // Log the response data for debugging

        if (data && !data.Message) {
            // Populate the form fields with tag information
            titleInput.value = data.title ? data.title : 'Untitled';  // Default if title is empty
            descriptionInput.value = data.description ? data.description : 'No description available';  // Default if description is empty
            currentKeywords = data.keywords || [];  // Default to empty array if no keywords

            // Populate keywords in the list
            updateKeywordList();
        } else {
            console.error('No tag data found for the given URL.');
        }
    })
    .catch(error => console.error('Error fetching tag data:', error));

    // Update keyword list with checkboxes to make them selectable
    function updateKeywordList() {
        keywordList.innerHTML = '';  // Clear current list
        currentKeywords.forEach(keyword => {
            const div = document.createElement("div");

            // Create checkbox for each keyword
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = keyword;
            checkbox.id = keyword;
            checkbox.checked = true;  // Initially checked since it's already in the current list

            const label = document.createElement("label");
            label.htmlFor = keyword;
            label.textContent = keyword;

            // Append checkbox and label to div
            div.appendChild(checkbox);
            div.appendChild(label);

            // Append div to keywordList
            keywordList.appendChild(div);

            // Add event listener for each checkbox
            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) {
                    // Add keyword back to the currentKeywords list
                    if (!currentKeywords.includes(keyword)) {
                        currentKeywords.push(keyword);
                    }
                } else {
                    // Remove keyword from currentKeywords list
                    currentKeywords = currentKeywords.filter(k => k !== keyword);
                }
            });
        });
    }

    // Add keyword
    document.getElementById('addKeywordBtn').addEventListener('click', () => {
        const keywordInput = document.getElementById('keywordInput').value.trim();
        if (keywordInput && !currentKeywords.includes(keywordInput)) {
            currentKeywords.push(keywordInput);
            updateKeywordList();
        }
    });

    // Remove selected keyword
    document.getElementById('removeKeywordBtn').addEventListener('click', () => {
        const selectedKeyword = document.getElementById('keywordInput').value.trim();
        currentKeywords = currentKeywords.filter(keyword => keyword !== selectedKeyword);
        updateKeywordList();
    });

    // Save changes (OK button)
    document.getElementById('saveBtn').addEventListener('click', () => {
        const title = titleInput.value;
        const description = descriptionInput.value;
        const picture = pictureInput.files[0];

        // Create FormData for multipart request
        const formData = new FormData();
        formData.append('url', tagUrl);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('keywords', currentKeywords.join(','));  // Join keywords as comma-separated string
        if (picture) {
            formData.append('picture', picture);
        }

        fetch('http://127.0.0.1:8000/tag', {
            method: 'PUT',  // Use POST method as per the new update
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
            },
            body: formData  // Send FormData to handle file upload and other fields
        })
        .then(response => response.json())
        .then(data => {
            alert('Tag updated successfully!');
            window.location.href = 'main_page.html';
        })
        .catch(error => console.error('Error updating tag:', error));
    });

    // Cancel button handler
    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.location.href = 'main_page.html';
    });
});
