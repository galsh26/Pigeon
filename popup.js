document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');
    const mainScreen = document.getElementById('main-screen');
    const saveScreen = document.getElementById('save-screen');
    const sortScreen = document.getElementById('sort-screen');

    const addFavoritesButton = document.getElementById('add-favorites-button');
    const sortFavoritesButton = document.getElementById('sort-favorites-button');

    const saveApproveButton = document.getElementById('save-approve-button');
    const saveCancelButton = document.getElementById('save-cancel-button');
    
    const signupButton = document.getElementById('signup-button');
    const approveButton = document.getElementById('approve-button');
    const backToLoginButton = document.getElementById('back-to-login');
    
    const sortApproveButton = document.getElementById('sort-approve-button');
    const sortCancelButton = document.getElementById('sort-cancel-button');

    const otherSavedAsList = document.getElementById('other-saved-as');
    const relevantFoldersList = document.getElementById('relevant-folders');
    const sortOptions = document.getElementById('sort-options');
    const favoriteNameInput = document.getElementById('favorite-name');
    const favoritesList = document.getElementById('favorites-list');

    const rememberMeCheckbox = document.getElementById('remember-me');

    function applyInputStyles() {
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            input.style.width = "80%";
            input.style.maxWidth = "300px";
            input.style.margin = "0 auto";
            input.style.display = "block";
        });
    }

    // Switch to Sign Up screen
    signupButton.addEventListener('click', function () {
        loginScreen.style.display = 'none';
        signupScreen.style.display = 'block';
        applyInputStyles();
    });

    // Back to Login screen
    backToLoginButton.addEventListener('click', function () {
        signupScreen.style.display = 'none';
        loginScreen.style.display = 'block';
        applyInputStyles();
    });

    document.addEventListener('DOMContentLoaded', function() {
        applyInputStyles();
        const storedEmail = sessionStorage.getItem('userEmail');
    
        if (storedEmail) {
            loginScreen.style.display = 'none';
            mainScreen.style.display = 'block';
        } else {
            loginScreen.style.display = 'block';
        }
    });

    // Approve registration and go back to login
    document.getElementById('approve-button').addEventListener('click', async function() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const confirmPassword = document.getElementById('signup-confirm-password').value.trim();
    
        if (!email || !password || !confirmPassword) {
            alert('Please fill out all fields.');
            return;
        }
    
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:8000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });
    
            if (response.ok) {
                alert('Registration successful! Redirecting to login.');
                signupScreen.style.display = 'none';
                loginScreen.style.display = 'block';
            } else {
                const errorData = await response.json();
                alert('Registration failed: ' + JSON.stringify(errorData));
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('An error occurred. Please try again later.');
        }
    });    
    
    document.getElementById('login-button').addEventListener('click', async function() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('remember-me').checked;
    
        if (!email || !password) {
            alert('Please fill out both email and password fields.');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password })
            });
    
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.access_token);
    
                if (rememberMe) {
                    sessionStorage.setItem('userEmail', email);
                } else {
                    sessionStorage.removeItem('userEmail');
                }

                alert('Login successful!');
                loginScreen.style.display = 'none';
                mainScreen.style.display = 'block';
    
            } else {
                const errorData = await response.json();
                alert('Login failed: ' + errorData.detail);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again later.');
        }
    });    

    // Check if the user is already logged in
    if (sessionStorage.getItem('userEmail')) {
        loginScreen.style.display = 'none';
        // Show the main screen or whatever comes after login
    }

    // Switch to Add to Favorites screen
    addFavoritesButton.addEventListener('click', function () {
        mainScreen.style.display = 'none';
        saveScreen.style.display = 'block';
    });

    // Switch to Sort Favorites screen
    sortFavoritesButton.addEventListener('click', function () {
        mainScreen.style.display = 'none';
        sortScreen.style.display = 'block';
    });

    // Go back to Main Screen from Save Screen
    saveCancelButton.addEventListener('click', function () {
        saveScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });

    // Go back to Main Screen from Sort Screen
    sortCancelButton.addEventListener('click', function () {
        sortScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });

    async function fetchKeywords(url) {
        try {
            const response = await fetch(`http://127.0.0.1:8001/keywords/?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            console.log(url);
            console.log(data.keywords);
            return data.keywords;
        } catch (error) {
            console.error('Error fetching keywords:', error);
            return [];
        }
    }

    function displayKeywords(keywords) {
        relevantFoldersList.innerHTML = '';
        keywords.forEach(keyword => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox"> ${keyword}`;
            relevantFoldersList.appendChild(label);
            relevantFoldersList.appendChild(document.createElement('br'));
        });
    }

    async function getCurrentTabAndKeywords() {
        try {
            const url = await new Promise((resolve, reject) => {
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    if (tabs[0]) {
                        resolve(tabs[0].url);
                    } else {
                        reject(new Error('No active tab found'));
                    }
                });
            });

            const keywords = await fetchKeywords(url);
            console.log('Fetched Keywords:', keywords);
            displayKeywords(keywords);
        } catch (error) {
            console.error('Error getting current tab and keywords:', error);
        }
    }

    getCurrentTabAndKeywords();
    fetchBookmarks();

    sortOptions.addEventListener('change', function() {
        const selectedValue = sortOptions.value;

        switch(selectedValue) {
            case '':
                console.log('No sort option selected');
                break;
            case 'name':
                console.log('Sort by Name option selected');
                break;
            case 'date':
                console.log('Sort by Date option selected');
                break;
            case 'links':
                console.log('Sort by Number of Links option selected');
                break;
            default:
                console.log('Unexpected value selected');
                break;
        }
    });

    function sortBy(bookmarks, option) {
        if (option === 'links') {
            const folders = bookmarks.filter(b => b.children);
            const links = bookmarks.filter(b => !b.children);

            folders.sort((a, b) => (b.children.length - a.children.length));

            return [...folders, ...links];
        } else {
            switch(option) {
                case 'name':
                    return bookmarks.sort((a, b) => a.title.localeCompare(b.title));
                case 'date':
                    return bookmarks.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
                default:
                    return bookmarks;
            }
        }
    }

    function flattenBookmarks(bookmarkTree) {
        const bookmarks = [];
    
        // Traverse function that will be used within flattenBookmarks
        function traverseBookmarks(node) {
            const nodeTitle = node.title ? node.title.toLowerCase() : '';
            const isFolder = !node.url;
    
            if (isFolder) {
                // Add the node (folder) to the bookmarks array
                bookmarks.push(node);
    
                // Recursively traverse through child nodes
                if (node.children) {
                    node.children.forEach(child => traverseBookmarks(child));
                }
            } else {
                // If it's a bookmark (not a folder), add it to the bookmarks array
                bookmarks.push(node);
            }
        }
    
        // Start traversing from the root nodes
        bookmarkTree.forEach(root => {
            traverseBookmarks(root);
        });
    
        return bookmarks;
    }    

    function updateBookmarksOrder(bookmarks) {
        bookmarks.forEach((bookmark, index) => {
            chrome.bookmarks.move(bookmark.id, { index: index });
        });
    }

    async function getOrCreateFolder(folderName) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.search({ title: folderName }, function(results) {
                if (results.length > 0 && results[0].url === undefined) {
                    resolve(results[0].id);
                } else {
                    chrome.bookmarks.create({ title: folderName }, function(newFolder) {
                        resolve(newFolder.id);
                    });
                }
            });
        });
    }

    async function getOrCreateSubFolder(parentFolderId, folderName) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getChildren(parentFolderId, function(results) {
                const existingFolder = results.find(result => result.title === folderName && !result.url);
                if (existingFolder) {
                    resolve(existingFolder.id);
                } else {
                    chrome.bookmarks.create({ parentId: parentFolderId, title: folderName }, function(newFolder) {
                        resolve(newFolder.id);
                    });
                }
            });
        });
    }

    // Approve in Save Screen
    saveApproveButton.addEventListener('click', async function () {
        const favoriteName = favoriteNameInput.value;
        const selectedFolders = Array.from(relevantFoldersList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.parentElement.textContent.trim());
    
        if (!favoriteName || selectedFolders.length === 0) {
            alert('Please enter a favorite name and select at least one folder.');
            return;
        }
    
        // Get the current tab's URL and title
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        const title = tab.title || favoriteName;
    
        // Get or create the selected folders and save the bookmark
        for (const folderName of selectedFolders) {
            const folderId = await getOrCreateFolder(folderName);
            await chrome.bookmarks.create({
                parentId: folderId,
                title: favoriteName,
                url: url
            });
        }
    
        saveScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        alert('Bookmark saved successfully!');
    });
    

    // Approve in Sort Screen
    sortApproveButton.addEventListener('click', function () {
        const selectedOption = sortOptions.value;
        
        chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
            const bookmarks = flattenBookmarks(bookmarkTreeNodes);
            const sortedBookmarks = sortBy(bookmarks, selectedOption);
            updateBookmarksOrder(sortedBookmarks);
        });
    
        sortScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });
    

    // Existing functionality for populating options, sorting, etc.
    function populateOptions(bookmarkTree) {
        // Clear the list before adding new folders
        favoritesList.innerHTML = '';
        otherSavedAsList.innerHTML = ''; // Clear the otherSavedAsList before adding new options
        
        const otherOptions = ['Option 1', 'Option 2', 'Option 3'];
        const folderOptions = extractFolderNames(bookmarkTree);
    
        // Populate the "Other people saved it as:" list with only 3 options
        if (otherSavedAsList) {
            otherOptions.forEach(option => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox"> ${option}`;
                otherSavedAsList.appendChild(label);
                otherSavedAsList.appendChild(document.createElement('br'));
            });
        } else {
            console.error("otherSavedAsList element not found!");
        }
    
        // Populate the folders dropdown with folder names
        folderOptions.forEach(folder => {
            const option = document.createElement('option');
            option.textContent = folder;
            favoritesList.appendChild(option);
        });
    
        const allBookmarksOption = document.createElement('option');
        allBookmarksOption.textContent = 'All Bookmarks';
        favoritesList.appendChild(allBookmarksOption);
    }       

    function extractFolderNames(bookmarkTree) {
        const folders = [];

        function traverse(node) {
            if (node.children) {
                node.children.forEach(child => {
                    if (child.children) {
                        folders.push(child.title);
                        traverse(child);
                    }
                });
            }
        }

        bookmarkTree.forEach(root => {
            traverse(root);
        });

        return folders;
    }

    function fetchBookmarks() {
        chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
            populateOptions(bookmarkTreeNodes);
        });
    }

    fetchBookmarks();

    // New code for search functionality
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('searchInput');
    const searchFolders = document.getElementById('searchFolders');
    const searchWebsites = document.getElementById('searchWebsites');
    const resultsList = document.getElementById('resultsList');

    function searchBookmarks(keywords, searchFolders, searchWebsites) {
        chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
            const folders = [];
            const websites = [];
            const searchTerms = keywords.map(keyword => keyword.trim().toLowerCase());
    
            function traverseBookmarks(node) {
                const nodeTitle = node.title ? node.title.toLowerCase() : '';
                const isFolder = !node.url;
                let foundTermsInFolder = new Set(); // Keep track of found terms in the folder or its children
                let matchedWebsites = [];
    
                if (isFolder) {
                    // Check if any of the search terms are found in the folder name
                    searchTerms.forEach(term => {
                        if (nodeTitle.includes(term)) {
                            foundTermsInFolder.add(term);
                        }
                    });
    
                    // Check if any of the search terms are found in the children (websites) inside the folder
                    if (node.children) {
                        node.children.forEach(child => {
                            const childTitle = child.title ? child.title.toLowerCase() : '';
                            let childMatched = false;
                            searchTerms.forEach(term => {
                                if (childTitle.includes(term)) {
                                    foundTermsInFolder.add(term);
                                    childMatched = true;
                                }
                            });
                            if (childMatched) {
                                matchedWebsites.push(child); // Add matched website to the array
                            }
                        });
                    }
    
                    // If all search terms are found in either the folder or its children, add the folder to results
                    if (searchTerms.every(term => foundTermsInFolder.has(term))) {
                        folders.push(node);
    
                        // Add all matched websites to the results
                        websites.push(...matchedWebsites);
                    }
    
                    // Continue traversing the subfolders
                    if (node.children) {
                        node.children.forEach(child => traverseBookmarks(child));
                    }
                } else if (searchWebsites && searchTerms.every(term => nodeTitle.includes(term))) {
                    websites.push(node);
                }
            }
    
            bookmarkTreeNodes.forEach(rootNode => traverseBookmarks(rootNode));
    
            // Display results based on user's selection
            displaySearchResults(folders, websites, searchFolders, searchWebsites);
        });
    }

     // Function to fetch the summary
    async function fetchSummary(url) {
        try {
            const response = await fetch(`http://127.0.0.1:8001/summary/?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            return data.summary;
        } catch (error) {
            console.error('Error fetching summary:', error);
            return "Error fetching summary.";
        }
    }

    // Function to update summary when hovering over a link
    async function updateSummaryOnHover(url) {
        const summary = await fetchSummary(url);
        const summaryContent = document.getElementById('summary-content');
        
        // Split the summary into sentences and wrap each sentence in a <p> tag
        const sentences = summary.split('.').filter(sentence => sentence.trim() !== '');
        const formattedSummary = sentences.map(sentence => `<p>${sentence.trim()}.</p>`).join('');
        
        // Update the summary content with the formatted summary
        summaryContent.innerHTML = formattedSummary;
    }

    
    function displaySearchResults(folders, websites, shouldDisplayFolders, shouldDisplayWebsites) {
        resultsList.innerHTML = '';
    
        const displayedTitles = new Set();  // Set to track displayed titles
    
        if (!shouldDisplayFolders && !shouldDisplayWebsites) {
            resultsList.innerHTML = '<li class="list-group-item">Please select an option to display results.</li>';
            return;
        }
    
        if (shouldDisplayFolders && folders.length > 0) {
            folders.forEach(folder => {
                const title = folder.title || 'Untitled';
                if (!displayedTitles.has(title)) {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item';
                    listItem.textContent = title;
    
                    const arrow = document.createElement('span');
                    arrow.className = 'folder-arrow';
                    listItem.appendChild(arrow);
    
                    listItem.style.cursor = 'pointer';
    
                    listItem.addEventListener('click', function () {
                        if (listItem.nextSibling && listItem.nextSibling.classList.contains('nested')) {
                            listItem.parentNode.removeChild(listItem.nextSibling);
                        } else {
                            const nestedList = document.createElement('ul');
                            nestedList.className = 'list-group nested';
                            folder.children.forEach(child => {
                                const nestedItem = document.createElement('li');
                                nestedItem.className = 'list-group-item';
                                nestedItem.innerHTML = `<a href="${child.url}" target="_blank">${child.title || 'Untitled'}</a>`;
    
                                // Add event listener to update summary on hover
                                nestedItem.addEventListener('mouseover', function () {
                                    updateSummaryOnHover(child.url);
                                });
    
                                nestedList.appendChild(nestedItem);
                            });
                            listItem.parentNode.insertBefore(nestedList, listItem.nextSibling);
                        }
                    });
    
                    resultsList.appendChild(listItem);
                    displayedTitles.add(title);  // Add title to the set to prevent duplicates
                }
            });
        }
    
        if (shouldDisplayWebsites && websites.length > 0) {
            websites.forEach(website => {
                const title = website.title || 'Untitled';
                if (!displayedTitles.has(title)) {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item';
                    listItem.innerHTML = `<a href="${website.url}" target="_blank">${title}</a>`;
    
                    // Add event listener to update summary on hover
                    listItem.addEventListener('mouseover', function () {
                        updateSummaryOnHover(website.url);
                    });
    
                    resultsList.appendChild(listItem);
                    displayedTitles.add(title);  // Add title to the set to prevent duplicates
                }
            });
        }
    
        if (resultsList.innerHTML === '') {
            resultsList.innerHTML = '<li class="list-group-item">No results found</li>';
        }
    }        
    
    searchButton.addEventListener('click', function () {
        const keywords = searchInput.value.split(',');
        if (keywords.length === 0) {
            alert('Please enter at least one keyword.');
            return;
        }
    
        const shouldSearchFolders = searchFolders.checked;
        const shouldSearchWebsites = searchWebsites.checked;
    
        if (!shouldSearchFolders && !shouldSearchWebsites) {
            alert('Please select at least one option (Folders/Websites) to search.');
            return;
        }
    
        searchBookmarks(keywords, shouldSearchFolders, shouldSearchWebsites);
    });    
});
