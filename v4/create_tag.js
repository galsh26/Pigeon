document.addEventListener("DOMContentLoaded", function() {
    const captureBtn = document.getElementById('captureBtn');
    const screenshotImg = document.getElementById('screenshot');
    const currentUrlElement = document.getElementById('currentUrl');
    const tagName = document.getElementById('tagName');
    const description = document.getElementById('description');
    const keywordsContainer = document.getElementById('keywordsContainer');
    const newKeyword = document.getElementById('newKeyword');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const addBtn = document.getElementById('addBtn');
    const cancelBtn = document.getElementById('cancelBtn');
  
    // Loading elements
    const loadingDescription = document.getElementById('loadingDescription');
    const loadingKeywords = document.getElementById('loadingKeywords');
  
    // Get the accessToken from localStorage (or sessionStorage, depending on where it's stored)
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  
    if (!accessToken) {
        alert('No access token found. Please log in again.');
        return;
    }
  
    // Get current tab's URL and title
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        const currentUrl = activeTab.url;
        const tabTitle = activeTab.title;
  
        // Set URL and Title in the form
        currentUrlElement.textContent = currentUrl;
        tagName.value = tabTitle;
  
        // Fetch description from server based on the URL
        loadingDescription.style.display = 'block'; // Show loading
        fetch(`http://127.0.0.1:8000/generate-summarize-for-url?url=${encodeURIComponent(currentUrl)}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
          .then(response => response.json())
          .then(data => {
              loadingDescription.style.display = 'none'; // Hide loading
              if (data && data.summary) {
                  description.value = data.summary;
              } else {
                  description.value = "No description available.";
              }
          })
          .catch(error => {
              console.error("Error fetching description:", error);
              description.value = "Error fetching description.";
              loadingDescription.style.display = 'none'; // Hide loading even on error
          });
  
        // Fetch keywords from server based on the URL
        loadingKeywords.style.display = 'block'; // Show loading
        fetch(`http://127.0.0.1:8000/generate-keywords-for-url?url=${encodeURIComponent(currentUrl)}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                loadingKeywords.style.display = 'none'; // Hide loading
                keywordsContainer.innerHTML = ''; // Clear existing options
                data.forEach(keyword => {
                    const keywordItem = document.createElement('div');
                    keywordItem.classList.add('keyword-item');
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = keyword;
                    checkbox.checked = true;
  
                    const label = document.createElement('label');
                    label.textContent = keyword;
  
                    keywordItem.appendChild(checkbox);
                    keywordItem.appendChild(label);
                    keywordsContainer.appendChild(keywordItem);
                });
            })
            .catch(error => {
                console.error("Error fetching keywords:", error);
                loadingKeywords.style.display = 'none'; // Hide loading on error
            });
    });
  
    // Automatically capture a screenshot when the page loads
    captureScreenshot();
  
    // Event listener to retake a screenshot
    if (captureBtn) {
        captureBtn.addEventListener("click", captureScreenshot);
    }
  
    function captureScreenshot() {
        try {
            chrome.tabs.captureVisibleTab(null, {}, function(image) {
                screenshotImg.src = image;
                screenshotImg.style.display = 'block';
            });
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
    }
  
    // Add new keyword to the list with a checkbox
    addKeywordBtn.addEventListener('click', function() {
        const keyword = newKeyword.value.trim();
        if (keyword) {
            const keywordItem = document.createElement('div');
            keywordItem.classList.add('keyword-item');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = keyword;
            checkbox.checked = true;
  
            const label = document.createElement('label');
            label.textContent = keyword;
  
            keywordItem.appendChild(checkbox);
            keywordItem.appendChild(label);
            keywordsContainer.appendChild(keywordItem);
  
            newKeyword.value = '';
        }
    });
  
    // Handle "Add" button click (Create Tag with Image Upload)
    addBtn.addEventListener('click', function() {
        const url = currentUrlElement.textContent;
        const tagNameValue = tagName.value;
        const descriptionValue = description.value;
        const selectedKeywords = Array.from(keywordsContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
  
        // Create a new FormData object to handle both form fields and file upload
        const formData = new FormData();
        formData.append('url', url);
        formData.append('title', tagNameValue);
        formData.append('keywords', selectedKeywords.join(','));
        formData.append('picture', screenshotImg.src); // Directly append the image URL
        formData.append('description', descriptionValue);
  
        // Convert the image (screenshot) to a Blob and append it to the FormData
        fetch(screenshotImg.src)
          .then(res => res.blob())
          .then(blob => {
            formData.append('picture', blob, 'screenshot.png'); // Append the image as "picture"
  
            // Send form data (including image) to the backend
            fetch('http://127.0.0.1:8000/tag', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}` // Replace with your actual token
                },
                body: formData // Send formData containing all the fields and the image
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message); // Display the message from the server
                    chrome.runtime.sendMessage({ action: "closePopup" });
                    window.close();
                } else {
                    alert("Tag created successfully.");
                    chrome.runtime.sendMessage({ action: "closePopup" });
                    window.close();
                    // close the popup
                }
            })
            .catch(error => {
                console.error("Error creating tag:", error);
                alert("An error occurred while creating the tag.");
            });
          });
    });

    // Handle "Cancel" button click
    cancelBtn.addEventListener('click', function() {
        // return to previous page
        window.location.href = 'main_page.html';
    });
});
