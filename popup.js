document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const approveButton = document.getElementById('approve-button');
    const cancelButton = document.getElementById('cancel-button');
    const otherSavedAsList = document.getElementById('other-saved-as');
    const relevantFoldersList = document.getElementById('relevant-folders');
    const sortOptions = document.getElementById('sort-options');
    const favoriteNameInput = document.getElementById('favorite-name');
    const favoritesList = document.getElementById('favorites-list');

    loginButton.addEventListener('click', function () {
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    });

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

    approveButton.addEventListener('click', async function () {
        const selectedName = favoriteNameInput.value.trim();
        const selectedKeywords = Array.from(relevantFoldersList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentElement.textContent.trim());
        const selectedFolder = favoritesList.options[favoritesList.selectedIndex].textContent;
    
        const url = await new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    resolve(tabs[0].url);
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    
        if (selectedName && selectedKeywords.length > 0) {
            if (selectedFolder === 'All Bookmarks') {
                for (const keyword of selectedKeywords) {
                    const folderId = await getOrCreateFolder(keyword);
                    await chrome.bookmarks.create({
                        parentId: folderId,
                        title: selectedName,
                        url: url
                    });
                }
                alert(`Bookmark saved in folders: ${selectedKeywords.join(', ')} under All Bookmarks`);
            } else {
                const parentFolderId = await getOrCreateFolder(selectedFolder);
                for (const keyword of selectedKeywords) {
                    const folderId = await getOrCreateSubFolder(parentFolderId, keyword);
                    await chrome.bookmarks.create({
                        parentId: folderId,
                        title: selectedName,
                        url: url
                    });
                }
                alert(`Bookmark saved in folders: ${selectedKeywords.join(', ')} under ${selectedFolder}`);
            }
        } else {
            alert('Please select a folder, a keyword, and enter a favorite name.');
        }
    
        window.close();
    });    

    cancelButton.addEventListener('click', function () {
        favoriteNameInput.value = '';
        favoritesList.selectedIndex = -1;
        window.close();
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
});
