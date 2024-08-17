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

        function traverse(node) {
            if (node.url) {
                bookmarks.push(node);
            }
            if (node.children) {
                bookmarks.push(node);
                node.children.forEach(child => traverse(child));
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
        const otherOptions = ['Option 1', 'Option 2', 'Option 3'];
        const folderOptions = extractFolderNames(bookmarkTree);

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

        folderOptions.forEach(folder => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox"> ${folder}`;
            relevantFoldersList.appendChild(label);
            relevantFoldersList.appendChild(document.createElement('br'));

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
});
