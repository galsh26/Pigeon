document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const saveScreen = document.getElementById('save-screen');
    const sortScreen = document.getElementById('sort-screen');

    const addFavoritesButton = document.getElementById('add-favorites-button');
    const sortFavoritesButton = document.getElementById('sort-favorites-button');

    const saveApproveButton = document.getElementById('save-approve-button');
    const saveCancelButton = document.getElementById('save-cancel-button');
    
    const sortApproveButton = document.getElementById('sort-approve-button');
    const sortCancelButton = document.getElementById('sort-cancel-button');

    const otherSavedAsList = document.getElementById('other-saved-as');
    const relevantFoldersList = document.getElementById('relevant-folders');
    const sortOptions = document.getElementById('sort-options');
    const favoriteNameInput = document.getElementById('favorite-name');
    const favoritesList = document.getElementById('favorites-list');

    loginButton.addEventListener('click', function () {
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });

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
            const response = await fetch(`http://127.0.0.1:8000/keywords/?url=${encodeURIComponent(url)}`);
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

        function traverseBookmarks(node) {
            const nodeTitle = node.title ? node.title.toLowerCase() : '';
            const isFolder = !node.url;
            let foundTermsInFolder = new Set(); // Keep track of terms found in the folder or websites inside it
        
            if (isFolder) {
                // Check the folder name
                searchTerms.forEach(term => {
                    if (nodeTitle.includes(term)) {
                        foundTermsInFolder.add(term);
                    }
                });
        
                // Check the websites inside the folder
                if (node.children) {
                    node.children.forEach(child => {
                        const childTitle = child.title ? child.title.toLowerCase() : '';
                        searchTerms.forEach(term => {
                            if (childTitle.includes(term)) {
                                foundTermsInFolder.add(term);
                            }
                        });
                    });
                }
        
                // If all terms are found (in the folder or inside it), add the folder to the results
                if (searchTerms.every(term => foundTermsInFolder.has(term))) {
                    folders.push(node);
                }
        
                // Continue searching in subfolders
                if (node.children) {
                    node.children.forEach(child => traverseBookmarks(child));
                }
            } else if (searchWebsites && searchTerms.every(term => nodeTitle.includes(term))) {
                websites.push(node);
            }
        }           

        bookmarkTree.forEach(root => {
            traverse(root);
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
                let matchesFolder = false;
                let matchesInChildren = false;

                if (isFolder) {
                    matchesFolder = searchTerms.every(term => nodeTitle.includes(term));
                    
                    if (node.children) {
                        matchesInChildren = node.children.some(child => 
                            searchTerms.every(term => (child.title ? child.title.toLowerCase() : '').includes(term))
                        );
                    }

                    if (searchFolders && (matchesFolder || matchesInChildren)) {
                        folders.push(node);
                    }

                    if (node.children) {
                        node.children.forEach(child => traverseBookmarks(child));
                    }
                } else if (searchWebsites && searchTerms.every(term => nodeTitle.includes(term))) {
                    websites.push(node);
                }
            }

            bookmarkTreeNodes.forEach(rootNode => traverseBookmarks(rootNode));

            const results = [...folders, ...websites];
            displaySearchResults(results);
        });
    }

    function displaySearchResults(results) {
        resultsList.innerHTML = '';

        if (results.length === 0) {
            resultsList.innerHTML = '<li class="list-group-item">No results found</li>';
            return;
        }

        results.forEach(result => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';

            if (result.url) {
                // This is a website, add a clickable link
                listItem.innerHTML = `<a href="${result.url}" target="_blank">${result.title || 'Untitled'}</a>`;
            } else if (result.children) {
                // This is a folder, add an option to open the folder and see the websites inside
                listItem.textContent = result.title || 'Untitled';
            
                const arrow = document.createElement('span');
                arrow.className = 'folder-arrow';
                listItem.appendChild(arrow);  // The arrow is added after the folder name
            
                listItem.style.cursor = 'pointer';

                listItem.addEventListener('click', function () {
                    if (listItem.nextSibling && listItem.nextSibling.classList.contains('nested')) {
                        // If the list is already open, close it
                        listItem.parentNode.removeChild(listItem.nextSibling);
                    } else {
                        const nestedList = document.createElement('ul');
                        nestedList.className = 'list-group nested';
                        result.children.forEach(child => {
                            const nestedItem = document.createElement('li');
                            nestedItem.className = 'list-group-item';
                            nestedItem.innerHTML = `<a href="${child.url}" target="_blank">${child.title || 'Untitled'}</a>`;
                            nestedList.appendChild(nestedItem);
                        });
                        listItem.parentNode.insertBefore(nestedList, listItem.nextSibling);
                    }
                });
            }

            resultsList.appendChild(listItem);
        });
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
