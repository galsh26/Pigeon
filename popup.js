document.addEventListener('DOMContentLoaded', function () {
    const approveButton = document.getElementById('approve-button');
    const cancelButton = document.getElementById('cancel-button');
    const otherSavedAsList = document.getElementById('other-saved-as');
    const relevantFoldersList = document.getElementById('relevant-folders');
    const sortOptions = document.getElementById('sort-options');
    const favoriteNameInput = document.getElementById('favorite-name');
    const favoritesList = document.getElementById('favorites-list');

    // Function to populate the options and folders dynamically
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
    }

    // Function to extract folder names from the bookmark tree
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

    // Function to fetch user's bookmarks
    function fetchBookmarks() {
        chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
            populateOptions(bookmarkTreeNodes);
        });
    }

    approveButton.addEventListener('click', function () {
        const selectedName = favoriteNameInput.value;
        const selectedFolders = Array.from(manualSelect.options).filter(option => option.selected).map(option => option.text);

        // Need to add the rest of the options
    });

    cancelButton.addEventListener('click', function () {
        favoriteNameInput.value = '';
        manualSelect.selectedIndex = -1;
        
        // Need to add the rest of the options
    });

    // Function to fetch keywords from FastAPI service
    async function fetchKeywords(url) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/keywords/?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            console.log(url)
            console.log(data.keywords);
            return data.keywords;
        } catch (error) {
            console.error('Error fetching keywords:', error);
            return [];
        }
    }

    // Function to display keywords with checkboxes
    function displayKeywords(keywords) {
        relevantFoldersList.innerHTML = ''; // Clear existing list
        keywords.forEach(keyword => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox"> ${keyword}`;
            relevantFoldersList.appendChild(label);
            relevantFoldersList.appendChild(document.createElement('br'));
        });
    }

    // Automatically fetch and display keywords for the current URL
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

    // Add event listener to detect changes in the selected sorting option
    sortOptions.addEventListener('change', function() {
        const selectedValue = sortOptions.value;
        
        switch(selectedValue) {
            case '':
                console.log('No sort option selected');
                break;
            case 'name':
                console.log('Sort by Name option selected');
                sortBy('name');
                break;
            case 'date':
                console.log('Sort by Date option selected');
                sortBy('date');
                break;
            case 'links':
                console.log('Sort by Number of Links option selected');
                sortBy('links');
                break;
            default:
                console.log('Unexpected value selected');
                break;
        }
    });

    // Function to handle sorting based on selected option
    function sortBy(option) {
        // Need to implement the sorting logic here
    }
});
