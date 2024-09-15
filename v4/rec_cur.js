document.addEventListener('DOMContentLoaded', function () {
    // Get the active tab's URL in Chrome
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;

        // Get the access token from local storage
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('Access token not found. Please log in.');
            return;
        }

        // Fetch recommendations using the /recommendation-for-current-url endpoint
        fetch(`http://127.0.0.1:8000/recommendation-for-current-url?url=${encodeURIComponent(currentUrl)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('recommendation-container');
                if (data.length === 0) {
                    container.innerHTML = '<p>No recommendations found for this URL.</p>';
                    return;
                }

                data.forEach(recommendation => {
                    const tile = document.createElement('div');
                    tile.classList.add('container');

                    tile.innerHTML = `
                        <div class="image-container">
                            <img src="data:image/png;base64,${recommendation.picture}" alt="Tile Image">
                        </div>
                        <div class="content">
                            <h2>${recommendation.title || 'No title available'}</h2>
                            <p>${recommendation.description || 'No description available'}</p>
                            <a href="${recommendation.url}" target="_blank">Visit Website</a>
                        </div>
                    `;

                    container.appendChild(tile);
                });
            })
            .catch(error => {
                console.error('Error fetching recommendations:', error);
                alert('Failed to load recommendations.');
            });
    });

    // Back button functionality to return to the main menu
    const backButton = document.getElementById('btn_back');
    backButton.addEventListener('click', function () {
        window.location.href = 'main_page.html';
    });
});
